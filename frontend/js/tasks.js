/**
 * NEXORA - Task Manager JavaScript (SVG Icon Edition)
 * Handles task CRUD, priority badges, due dates, and status filters.
 */

let currentFilter = 'All';
let currentPriority = 'All';
let editingTaskId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadTasks();
  initTaskFilters();
  initTaskForm();
});

async function loadTasks() {
  const container = document.getElementById('tasksListContainer');
  if (!container) return;

  const url = `/api/tasks?status=${encodeURIComponent(currentFilter)}&priority=${encodeURIComponent(currentPriority)}`;
  const data = await fetchAPI(url);

  if (!data || !data.success) {
    container.innerHTML = `<div class="empty-state"><p class="empty-description">Failed to load tasks.</p></div>`;
    return;
  }

  const tasks = data.tasks || [];

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </div>
        <h3 class="empty-title">No tasks found</h3>
        <p class="empty-description">Add a new daily task to keep track of your student to-dos.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddTaskModal()">+ Add New Task</button>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map(task => {
    const isCompleted = task.status === 'Completed';
    const badgeClass = task.priority === 'High' ? 'badge-high' : (task.priority === 'Medium' ? 'badge-medium' : 'badge-low');

    return `
      <div class="task-item ${isCompleted ? 'completed' : ''}" id="task-${task.id}">
        <div class="task-left">
          <div class="custom-checkbox ${isCompleted ? 'checked' : ''}" onclick="toggleTaskStatus(${task.id})">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="task-details">
            <span class="task-title">${escapeHTML(task.title)}</span>
            ${task.description ? `<p style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">${escapeHTML(task.description)}</p>` : ''}
            <div class="task-meta">
              <span class="badge ${badgeClass}">${task.priority}</span>
              ${task.due_date ? `<span>Due: ${task.due_date}</span>` : ''}
              <span class="badge ${isCompleted ? 'badge-completed' : 'badge-pending'}">${task.status}</span>
            </div>
          </div>
        </div>
        <div class="task-right">
          <button class="btn btn-ghost btn-sm" onclick='openEditTaskModal(${JSON.stringify(task)})' title="Edit Task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="deleteTask(${task.id})" title="Delete Task">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function initTaskFilters() {
  const statusTabs = document.querySelectorAll('.status-filter-tab');
  statusTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      statusTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter || 'All';
      loadTasks();
    });
  });

  const prioritySelect = document.getElementById('priorityFilterSelect');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      currentPriority = e.target.value;
      loadTasks();
    });
  }
}

function initTaskForm() {
  const form = document.getElementById('taskForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const due_date = document.getElementById('taskDueDate').value;

    if (!title) {
      showToast('Task title cannot be empty.', 'error');
      return;
    }

    let res;
    if (editingTaskId) {
      const status = document.getElementById('taskStatusEdit') ? document.getElementById('taskStatusEdit').value : 'Pending';
      res = await fetchAPI(`/api/tasks/${editingTaskId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description, priority, due_date, status })
      });
    } else {
      res = await fetchAPI('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority, due_date })
      });
    }

    if (res && res.success) {
      showToast(res.message, 'success');
      closeModal('taskModal');
      form.reset();
      editingTaskId = null;
      loadTasks();
    } else if (res) {
      showToast(res.message || 'Failed to save task.', 'error');
    }
  });
}

function openAddTaskModal() {
  editingTaskId = null;
  const form = document.getElementById('taskForm');
  if (form) form.reset();
  
  const titleEl = document.getElementById('taskModalTitle');
  if (titleEl) titleEl.textContent = 'Add New Task';

  const statusGroup = document.getElementById('taskStatusGroup');
  if (statusGroup) statusGroup.style.display = 'none';

  openModal('taskModal');
}

function openEditTaskModal(task) {
  editingTaskId = task.id;
  
  document.getElementById('taskTitle').value = task.title || '';
  document.getElementById('taskDescription').value = task.description || '';
  document.getElementById('taskPriority').value = task.priority || 'Medium';
  document.getElementById('taskDueDate').value = task.due_date || '';

  const statusGroup = document.getElementById('taskStatusGroup');
  const statusSelect = document.getElementById('taskStatusEdit');
  if (statusGroup && statusSelect) {
    statusGroup.style.display = 'flex';
    statusSelect.value = task.status || 'Pending';
  }

  const titleEl = document.getElementById('taskModalTitle');
  if (titleEl) titleEl.textContent = 'Edit Task';

  openModal('taskModal');
}

async function toggleTaskStatus(taskId) {
  const res = await fetchAPI(`/api/tasks/${taskId}/toggle`, { method: 'PATCH' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadTasks();
  }
}

async function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;

  const res = await fetchAPI(`/api/tasks/${taskId}`, { method: 'DELETE' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadTasks();
  }
}
