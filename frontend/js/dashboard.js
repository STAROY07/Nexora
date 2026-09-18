/**
 * NEXORA - Dashboard JavaScript (SVG Icon Edition)
 * Fetches and displays aggregated overview statistics and recent activities.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});

async function loadDashboardData() {
  const data = await fetchAPI('/api/dashboard/summary');
  if (!data || !data.success) return;

  // 1. Welcome Message & User details
  const welcomeName = document.getElementById('welcomeStudentName');
  if (welcomeName) {
    welcomeName.textContent = (data.user_name || 'STUDENT').toUpperCase();
  }

  // Update sidebar user snippet
  const avatarBadge = document.getElementById('sidebarAvatarBadge');
  if (avatarBadge) avatarBadge.textContent = (data.user_name || 'S')[0].toUpperCase();

  const sidebarName = document.getElementById('sidebarUserName');
  if (sidebarName) sidebarName.textContent = data.user_name;

  // 2. Stat Cards
  const stats = data.stats || {};
  document.getElementById('statActiveTasks').textContent = stats.active_tasks ?? 0;
  document.getElementById('statPendingAssignments').textContent = stats.pending_assignments ?? 0;
  document.getElementById('statUpcomingExams').textContent = stats.upcoming_exams ?? 0;
  document.getElementById('statTotalNotes').textContent = stats.total_notes ?? 0;
  
  const expenseEl = document.getElementById('statMonthlyExpenses');
  if (expenseEl) {
    const formattedAmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats.monthly_expenses || 0);
    expenseEl.textContent = formattedAmt;
  }

  // 3. Render Today's Tasks
  renderTodayTasks(data.today_tasks || []);

  // 4. Render Upcoming Assignments
  renderUpcomingAssignments(data.upcoming_assignments || []);

  // 5. Render Upcoming Exams
  renderUpcomingExams(data.upcoming_exams || []);

  // 6. Render Recent Notes
  renderRecentNotes(data.recent_notes || []);
}

function renderTodayTasks(tasks) {
  const container = document.getElementById('dashboardTodayTasks');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 0;">
        <p class="empty-description" style="margin-bottom: 0;">No tasks due today. You're all caught up!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks.map(t => {
    const isCompleted = t.status === 'Completed';
    const badgeClass = t.priority === 'High' ? 'badge-high' : (t.priority === 'Medium' ? 'badge-medium' : 'badge-low');
    return `
      <div class="task-item ${isCompleted ? 'completed' : ''}">
        <div class="task-left">
          <div class="custom-checkbox ${isCompleted ? 'checked' : ''}" onclick="toggleTaskFromDashboard(${t.id})">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="task-details">
            <span class="task-title">${escapeHTML(t.title)}</span>
            <div class="task-meta">
              <span class="badge ${badgeClass}">${t.priority}</span>
              ${t.due_date ? `<span>Due: ${t.due_date}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleTaskFromDashboard(taskId) {
  const res = await fetchAPI(`/api/tasks/${taskId}/toggle`, { method: 'PATCH' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadDashboardData();
  }
}

function renderUpcomingAssignments(assignments) {
  const container = document.getElementById('dashboardAssignments');
  if (!container) return;

  if (assignments.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 0;">
        <p class="empty-description" style="margin-bottom: 0;">No pending assignments coming up.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = assignments.map(a => {
    let daysLabel = `${a.days_left} Days Left`;
    let chipClass = 'safe';
    if (a.days_left < 0) {
      daysLabel = 'Overdue';
      chipClass = 'urgent';
    } else if (a.days_left === 0) {
      daysLabel = 'Due Today';
      chipClass = 'urgent';
    } else if (a.days_left <= 3) {
      chipClass = 'upcoming';
    }

    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 10px; box-shadow: var(--shadow-sm);">
        <div>
          <div style="font-weight: 700; font-size: 0.92rem; color: var(--text-main);">${escapeHTML(a.title)}</div>
          <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <span class="badge badge-subject">${escapeHTML(a.subject)}</span>
            <span style="font-size: 0.78rem; color: var(--text-dim);">Due: ${a.submission_date}</span>
          </div>
        </div>
        <span class="deadline-chip ${chipClass}">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${daysLabel}
        </span>
      </div>
    `;
  }).join('');
}

function renderUpcomingExams(exams) {
  const container = document.getElementById('dashboardExams');
  if (!container) return;

  if (exams.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 0;">
        <p class="empty-description" style="margin-bottom: 0;">No upcoming exams scheduled.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = exams.map(ex => {
    let daysLabel = `${ex.days_remaining} Days Remaining`;
    let badgeUrgent = ex.days_remaining <= 3 ? 'urgent' : '';
    if (ex.days_remaining === 0) daysLabel = 'Exam Today!';

    return `
      <div style="padding: 14px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 10px; box-shadow: var(--shadow-sm);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-main);">${escapeHTML(ex.exam_name)}</span>
          <span class="exam-countdown-badge ${badgeUrgent}" style="margin-bottom: 0; font-size: 0.75rem;">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${daysLabel}
          </span>
        </div>
        <div style="font-size: 0.82rem; color: var(--text-muted); display: flex; gap: 14px; flex-wrap: wrap;">
          <span>${escapeHTML(ex.subject)}</span>
          <span>${ex.exam_date_str}</span>
          ${ex.exam_time_str ? `<span>${ex.exam_time_str}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentNotes(notes) {
  const container = document.getElementById('dashboardNotes');
  if (!container) return;

  if (notes.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 0;">
        <p class="empty-description" style="margin-bottom: 0;">No study notes created yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notes.map(n => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 10px; box-shadow: var(--shadow-sm);">
      <div>
        <div style="font-weight: 700; font-size: 0.92rem; display: flex; align-items: center; gap: 6px; color: var(--text-main);">
          ${n.is_important ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="#d97706" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' : ''}
          ${escapeHTML(n.title)}
        </div>
        <span class="badge badge-subject" style="margin-top: 4px;">${escapeHTML(n.subject)}</span>
      </div>
      <span style="font-size: 0.78rem; color: var(--text-dim);">${n.updated_at}</span>
    </div>
  `).join('');
}
