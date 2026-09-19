/**
 * NEXORA - Assignment Tracker JavaScript (SVG Icon Edition)
 * Handles assignment CRUD, subject tags, submission countdowns, and completion status.
 */

let currentAssignmentFilter = 'All';
let editingAssignmentId = null;

document.addEventListener('DOMContentLoaded', () => {
  loadAssignmentStats();
  loadAssignments();
  initAssignmentFilters();
  initAssignmentForm();
});

async function loadAssignmentStats() {
  const data = await fetchAPI('/api/assignments');
  if (!data || !data.success) return;
  const assignments = data.assignments || [];
  const total = assignments.length;
  const completed = assignments.filter(a => a.status === 'Completed').length;
  const pending = total - completed;
  const totalEl = document.getElementById('assignStatTotal');
  const pendingEl = document.getElementById('assignStatPending');
  const completedEl = document.getElementById('assignStatCompleted');
  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (completedEl) completedEl.textContent = completed;
}

async function loadAssignments() {
  const container = document.getElementById('assignmentsGridContainer');
  if (!container) return;

  const url = `/api/assignments?status=${encodeURIComponent(currentAssignmentFilter)}`;
  const data = await fetchAPI(url);

  if (!data || !data.success) {
    container.innerHTML = `<div class="empty-state"><p class="empty-description">Failed to load assignments.</p></div>`;
    return;
  }

  const assignments = data.assignments || [];

  if (assignments.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <h3 class="empty-title">No assignments found</h3>
        <p class="empty-description">Keep track of your coursework submissions and deadlines in one place.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddAssignmentModal()">+ Add Assignment</button>
      </div>
    `;
    return;
  }

  container.innerHTML = assignments.map(a => {
    const isCompleted = a.status === 'Completed';
    let daysLabel = `${a.days_left} Days Left`;
    let chipClass = 'safe';

    if (isCompleted) {
      daysLabel = 'Submitted';
      chipClass = 'safe';
    } else if (a.days_left < 0) {
      daysLabel = `${Math.abs(a.days_left)} Days Overdue`;
      chipClass = 'urgent';
    } else if (a.days_left === 0) {
      daysLabel = 'Due Today';
      chipClass = 'urgent';
    } else if (a.days_left <= 3) {
      chipClass = 'upcoming';
    }

    return `
      <div class="assignment-card ${isCompleted ? 'completed' : ''}" id="assignment-${a.id}">
        <div>
          <div class="assignment-header">
            <span class="badge badge-subject">${escapeHTML(a.subject)}</span>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-ghost btn-sm" onclick='openEditAssignmentModal(${JSON.stringify(a)})' title="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="deleteAssignment(${a.id})" title="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          <h3 class="assignment-title">${escapeHTML(a.title)}</h3>
          ${a.description ? `<p class="assignment-desc">${escapeHTML(a.description)}</p>` : ''}
        </div>
        <div>
          <div class="assignment-footer">
            <span class="deadline-chip ${chipClass}">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${a.submission_date} (${daysLabel})
            </span>
            <button class="btn btn-sm ${isCompleted ? 'btn-secondary' : 'btn-primary'}" onclick="toggleAssignmentStatus(${a.id})">
              ${isCompleted ? 'Completed' : 'Mark Done'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function initAssignmentFilters() {
  const tabs = document.querySelectorAll('.assignment-filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentAssignmentFilter = tab.dataset.filter || 'All';
      loadAssignments();
    });
  });
}

function initAssignmentForm() {
  const form = document.getElementById('assignmentForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('assignTitle').value.trim();
    const subject = document.getElementById('assignSubject').value.trim();
    const description = document.getElementById('assignDescription').value.trim();
    const submission_date = document.getElementById('assignSubmissionDate').value;

    if (!title || !subject || !submission_date) {
      showToast('Title, subject, and submission date are required.', 'error');
      return;
    }

    let res;
    if (editingAssignmentId) {
      const status = document.getElementById('assignStatusEdit') ? document.getElementById('assignStatusEdit').value : 'Pending';
      res = await fetchAPI(`/api/assignments/${editingAssignmentId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, subject, description, submission_date, status })
      });
    } else {
      res = await fetchAPI('/api/assignments', {
        method: 'POST',
        body: JSON.stringify({ title, subject, description, submission_date })
      });
    }

    if (res && res.success) {
      showToast(res.message, 'success');
      closeModal('assignmentModal');
      form.reset();
      editingAssignmentId = null;
      loadAssignments();
    } else if (res) {
      showToast(res.message || 'Failed to save assignment.', 'error');
    }
  });
}

function openAddAssignmentModal() {
  editingAssignmentId = null;
  const form = document.getElementById('assignmentForm');
  if (form) form.reset();

  const titleEl = document.getElementById('assignModalTitle');
  if (titleEl) titleEl.textContent = 'Add New Assignment';

  const statusGroup = document.getElementById('assignStatusGroup');
  if (statusGroup) statusGroup.style.display = 'none';

  openModal('assignmentModal');
}

function openEditAssignmentModal(a) {
  editingAssignmentId = a.id;

  document.getElementById('assignTitle').value = a.title || '';
  document.getElementById('assignSubject').value = a.subject || '';
  document.getElementById('assignDescription').value = a.description || '';
  document.getElementById('assignSubmissionDate').value = a.submission_date || '';

  const statusGroup = document.getElementById('assignStatusGroup');
  const statusSelect = document.getElementById('assignStatusEdit');
  if (statusGroup && statusSelect) {
    statusGroup.style.display = 'flex';
    statusSelect.value = a.status || 'Pending';
  }

  const titleEl = document.getElementById('assignModalTitle');
  if (titleEl) titleEl.textContent = 'Edit Assignment';

  openModal('assignmentModal');
}

async function toggleAssignmentStatus(id) {
  const res = await fetchAPI(`/api/assignments/${id}/toggle`, { method: 'PATCH' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadAssignmentStats();
    loadAssignments();
  }
}

async function deleteAssignment(id) {
  if (!confirm('Are you sure you want to delete this assignment?')) return;

  const res = await fetchAPI(`/api/assignments/${id}`, { method: 'DELETE' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadAssignmentStats();
    loadAssignments();
  }
}
