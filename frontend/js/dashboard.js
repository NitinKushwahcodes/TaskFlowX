if (!Auth.isLoggedIn()) {
    window.location.href = 'index.html';
}

let currentPage     = 1;
let currentStatus   = '';
let currentPriority = '';
const LIMIT = 8;

(function init() {
    const user = Auth.getUser();
    if (user) {
        document.getElementById('userName').textContent   = user.userName || 'User';
        document.getElementById('userAvatar').textContent = (user.userName || 'U')[0].toUpperCase();
    }
    loadTasks();
    loadStats();
})();

// ── Toasts ────────────────────────────────────────────────────────────────

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const checkIcon = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    const errorIcon = `<svg class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${type === 'success' ? checkIcon : errorIcon}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 280);
    }, 3000);
}

// ── Skeleton loader ───────────────────────────────────────────────────────

function showSkeletons(count = 4) {
    document.getElementById('taskList').innerHTML = Array(count).fill(0).map(() => `
        <div class="task-skeleton">
            <div class="skeleton sk-circle"></div>
            <div class="sk-lines">
                <div class="skeleton sk-line-1"></div>
                <div class="skeleton sk-line-2"></div>
            </div>
        </div>
    `).join('');
}

// ── Stats ─────────────────────────────────────────────────────────────────

async function loadStats() {
    try {
        // Run all four count queries in parallel.
        const [all, todo, prog, done] = await Promise.all([
            TasksAPI.getAll({ limit: 1 }),
            TasksAPI.getAll({ limit: 1, status: 'todo' }),
            TasksAPI.getAll({ limit: 1, status: 'in-progress' }),
            TasksAPI.getAll({ limit: 1, status: 'done' })
        ]);

        document.getElementById('statTotal').textContent    = all.pagination?.total  ?? 0;
        document.getElementById('statTodo').textContent     = todo.pagination?.total ?? 0;
        document.getElementById('statProgress').textContent = prog.pagination?.total ?? 0;
        document.getElementById('statDone').textContent     = done.pagination?.total ?? 0;
    } catch (err) {
        console.error('Could not load stats:', err.message);
    }
}

// ── Task list ─────────────────────────────────────────────────────────────

async function loadTasks() {
    showSkeletons();

    try {
        const data = await TasksAPI.getAll({
            page:     currentPage,
            limit:    LIMIT,
            status:   currentStatus,
            priority: currentPriority
        });

        renderTasks(data.tasks || []);
        renderPagination(data.pagination || {});

        const total = data.pagination?.total ?? 0;
        document.getElementById('taskCountChip').textContent =
            `${total} task${total !== 1 ? 's' : ''}`;

    } catch (err) {
        document.getElementById('taskList').innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>${err.message || 'Failed to load tasks.'}</p>
            </div>`;
        showToast(err.message || 'Failed to load tasks', 'error');
    }
}

function renderTasks(tasks) {
    const list = document.getElementById('taskList');

    if (!tasks.length) {
        list.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <p>No tasks yet. Create your first one above!</p>
            </div>`;
        return;
    }

    list.innerHTML = tasks.map(task => buildTaskCard(task)).join('');
}

function buildTaskCard(task) {
    const isDone = task.status === 'done';

    const statusBadge = {
        'todo':        '<span class="badge badge-todo">To Do</span>',
        'in-progress': '<span class="badge badge-inprogress">In Progress</span>',
        'done':        '<span class="badge badge-done">Done</span>'
    }[task.status] || '';

    const priorityBadge = {
        'low':    '<span class="badge badge-low">Low</span>',
        'medium': '<span class="badge badge-medium">Medium</span>',
        'high':   '<span class="badge badge-high">High</span>'
    }[task.priority] || '';

    let dueHtml = '';
    if (task.dueDate) {
        const due       = new Date(task.dueDate);
        const today     = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = !isDone && due < today;
        const formatted = due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        dueHtml = `
            <span class="task-due ${isOverdue ? 'overdue' : ''}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8"  y1="2" x2="8"  y2="6"/>
                    <line x1="3"  y1="10" x2="21" y2="10"/>
                </svg>
                ${isOverdue ? '⚠ ' : ''}${formatted}
            </span>`;
    }

    return `
        <div class="task-card ${isDone ? 'done-card' : ''}" id="task-${task._id}">
            <div class="task-check ${isDone ? 'checked' : ''}"
                 onclick="toggleDone('${task._id}', '${task.status}')"
                 title="${isDone ? 'Mark as to-do' : 'Mark as done'}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="task-body">
                <div class="task-title">${escapeHtml(task.title)}</div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">${statusBadge}${priorityBadge}${dueHtml}</div>
            </div>
            <div class="task-actions">
                <button class="btn-icon" onclick='openEditModal(${JSON.stringify(task)})' title="Edit">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="btn-icon danger" onclick="deleteTask('${task._id}')" title="Delete">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/>
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                </button>
            </div>
        </div>`;
}

// ── Create ────────────────────────────────────────────────────────────────

async function createTask() {
    const title    = document.getElementById('newTitle').value.trim();
    const desc     = document.getElementById('newDesc').value.trim();
    const status   = document.getElementById('newStatus').value;
    const priority = document.getElementById('newPriority').value;
    const dueDate  = document.getElementById('newDueDate').value;

    if (!title) {
        showToast('Task title is required.', 'error');
        document.getElementById('newTitle').focus();
        return;
    }

    const btn = document.getElementById('createBtn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;

    try {
        await TasksAPI.create({ title, description: desc, status, priority, dueDate: dueDate || undefined });
        showToast('Task created!');
        clearCreateForm();
        currentPage = 1;
        await Promise.all([loadTasks(), loadStats()]);
    } catch (err) {
        showToast(err.message || 'Failed to create task.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add Task';
    }
}

function clearCreateForm() {
    document.getElementById('newTitle').value    = '';
    document.getElementById('newDesc').value     = '';
    document.getElementById('newStatus').value   = 'todo';
    document.getElementById('newPriority').value = 'medium';
    document.getElementById('newDueDate').value  = '';
}

// ── Toggle done ───────────────────────────────────────────────────────────

async function toggleDone(id, status) {
    const newStatus = status === 'done' ? 'todo' : 'done';
    try {
        await TasksAPI.update(id, { status: newStatus });
        showToast(newStatus === 'done' ? 'Marked as done!' : 'Task reopened.');
        await Promise.all([loadTasks(), loadStats()]);
    } catch (err) {
        showToast(err.message || 'Could not update task.', 'error');
    }
}

// ── Delete ────────────────────────────────────────────────────────────────

async function deleteTask(id) {
    if (!confirm('Delete this task? This cannot be undone.')) return;

    try {
        await TasksAPI.delete(id);
        showToast('Task deleted.');
        // Go back a page if we just deleted the last item on a non-first page.
        if (currentPage > 1 && document.querySelectorAll('.task-card').length === 1) {
            currentPage--;
        }
        await Promise.all([loadTasks(), loadStats()]);
    } catch (err) {
        showToast(err.message || 'Could not delete task.', 'error');
    }
}

// ── Edit modal ────────────────────────────────────────────────────────────

function openEditModal(task) {
    document.getElementById('editId').value       = task._id;
    document.getElementById('editTitle').value    = task.title;
    document.getElementById('editDesc').value     = task.description || '';
    document.getElementById('editStatus').value   = task.status;
    document.getElementById('editPriority').value = task.priority;
    document.getElementById('editDueDate').value  = task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '';

    document.getElementById('editModal').classList.add('open');
    document.getElementById('editTitle').focus();
}

function closeModal() {
    document.getElementById('editModal').classList.remove('open');
}

document.getElementById('editModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

async function saveEdit() {
    const id       = document.getElementById('editId').value;
    const title    = document.getElementById('editTitle').value.trim();
    const desc     = document.getElementById('editDesc').value.trim();
    const status   = document.getElementById('editStatus').value;
    const priority = document.getElementById('editPriority').value;
    const dueDate  = document.getElementById('editDueDate').value;

    if (!title) {
        showToast('Title cannot be empty.', 'error');
        return;
    }

    const btn = document.getElementById('saveEditBtn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span>`;

    try {
        await TasksAPI.update(id, { title, description: desc, status, priority, dueDate: dueDate || null });
        showToast('Task updated!');
        closeModal();
        await Promise.all([loadTasks(), loadStats()]);
    } catch (err) {
        showToast(err.message || 'Could not update task.', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
}

// ── Filters ───────────────────────────────────────────────────────────────

function applyFilters() {
    currentStatus   = document.getElementById('filterStatus').value;
    currentPriority = document.getElementById('filterPriority').value;
    currentPage = 1;
    loadTasks();
}

function resetFilters() {
    document.getElementById('filterStatus').value   = '';
    document.getElementById('filterPriority').value = '';
    currentStatus   = '';
    currentPriority = '';
    currentPage = 1;
    loadTasks();
}

// ── Pagination ────────────────────────────────────────────────────────────

function renderPagination(pagination) {
    const container = document.getElementById('pagination');
    const { page = 1, pages = 1 } = pagination;

    if (pages <= 1) { container.innerHTML = ''; return; }

    const prevArrow = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
    const nextArrow = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;

    let html = `<button class="page-btn" onclick="goToPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>${prevArrow}</button>`;

    const start = Math.max(1, page - 2);
    const end   = Math.min(pages, start + 4);

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    html += `
        <button class="page-btn" onclick="goToPage(${page + 1})" ${page >= pages ? 'disabled' : ''}>${nextArrow}</button>
        <span class="page-info">Page ${page} of ${pages}</span>`;

    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    loadTasks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Logout ────────────────────────────────────────────────────────────────

function logout() {
    Auth.logout();
    window.location.href = 'index.html';
}

// ── Helpers ───────────────────────────────────────────────────────────────

// Escape user-supplied content before injecting into the DOM.
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
