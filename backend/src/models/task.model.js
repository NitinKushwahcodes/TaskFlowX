const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Task title is required'],
            trim: true,
            minlength: [1, 'Title cannot be empty'],
            maxlength: [100, 'Title cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
            default: ''
        },
        status: {
            type: String,
            enum: {
                values: ['todo', 'in-progress', 'done'],
                message: 'Status must be todo, in-progress, or done'
            },
            default: 'todo'
        },
        priority: {
            type: String,
            enum: {
                values: ['low', 'medium', 'high'],
                message: 'Priority must be low, medium, or high'
            },
            default: 'medium'
        },
        dueDate: {
            type: Date,
            default: null
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Task must belong to a user']
        }
    },
    {
        timestamps: true
    }
);

// Compound indexes to speed up the most common queries:
// - fetch all tasks for a user, sorted by date
// - fetch tasks for a user filtered by status
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
