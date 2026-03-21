const Task = require('../models/task.model');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/v1/tasks
const createTask = asyncHandler(async (req, res) => {
    const { title, description, status, priority, dueDate } = req.body;

    if (!title || title.trim() === '') {
        return res.status(422).json({
            success: false,
            message: 'Task title is required'
        });
    }

    const task = await Task.create({
        title: title.trim(),
        description: description ? description.trim() : '',
        status: status || 'todo',
        priority: priority || 'medium',
        dueDate: dueDate || null,
        user: req.user._id
    });

    res.status(201).json({
        success: true,
        message: 'Task created successfully',
        task
    });
});

// GET /api/v1/tasks?page=1&limit=10&status=todo&priority=high
const getTasks = asyncHandler(async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip  = (page - 1) * limit;

    const filter = {};

    // Admins can see all tasks across users, regular users only see their own.
    if (req.user.role !== 'admin') {
        filter.user = req.user._id;
    }

    // Only apply the filter if the value is a valid enum option.
    const allowedStatuses   = ['todo', 'in-progress', 'done'];
    const allowedPriorities = ['low', 'medium', 'high'];

    if (req.query.status && allowedStatuses.includes(req.query.status)) {
        filter.status = req.query.status;
    }

    if (req.query.priority && allowedPriorities.includes(req.query.priority)) {
        filter.priority = req.query.priority;
    }

    // Run both queries in parallel to save a round trip.
    const [tasks, total] = await Promise.all([
        Task.find(filter)
            .populate(req.user.role === 'admin' ? { path: 'user', select: 'userName email' } : '')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Task.countDocuments(filter)
    ]);

    res.status(200).json({
        success: true,
        count: tasks.length,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            hasNextPage: page < Math.ceil(total / limit),
            hasPrevPage: page > 1
        },
        tasks
    });
});

// GET /api/v1/tasks/:id
const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to view this task'
        });
    }

    res.status(200).json({ success: true, task });
});

// PUT /api/v1/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to update this task'
        });
    }

    // Build the update object from only the fields we allow to be changed.
    // This prevents a user from passing { user: someOtherId } to hijack a task.
    const allowedUpdates = {
        ...(req.body.title       !== undefined && { title: req.body.title.trim() }),
        ...(req.body.description !== undefined && { description: req.body.description.trim() }),
        ...(req.body.status      !== undefined && { status: req.body.status }),
        ...(req.body.priority    !== undefined && { priority: req.body.priority }),
        ...(req.body.dueDate     !== undefined && { dueDate: req.body.dueDate })
    };

    if (Object.keys(allowedUpdates).length === 0) {
        return res.status(422).json({
            success: false,
            message: 'No valid fields provided for update'
        });
    }

    const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        allowedUpdates,
        { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        task: updatedTask
    });
});

// DELETE /api/v1/tasks/:id
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (task.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to delete this task'
        });
    }

    await task.deleteOne();

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask };
