/**
 * NEXORA - Exam Planner JavaScript (SVG Icon Edition)
 * Displays scheduled exams, venue details, and dynamic days-remaining countdowns.
 */

document.addEventListener('DOMContentLoaded', () => {
  loadExams();
  initExamForm();
});

async function loadExams() {
  const container = document.getElementById('examsGridContainer');
  if (!container) return;

  const data = await fetchAPI('/api/exams');
  if (!data || !data.success) {
    container.innerHTML = `<div class="empty-state"><p class="empty-description">Failed to load exams.</p></div>`;
    return;
  }

  const exams = data.exams || [];

  if (exams.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h3 class="empty-title">No exams scheduled</h3>
        <p class="empty-description">Add upcoming term tests, practicals, and semester finals to track countdowns.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddExamModal()">+ Schedule Exam</button>
      </div>
    `;
    return;
  }

  container.innerHTML = exams.map(ex => {
    let daysLabel = `${ex.days_remaining} Days Remaining`;
    let isUrgent = ex.days_remaining <= 3 && !ex.is_past;

    if (ex.is_past) {
      daysLabel = 'Completed / Past';
    } else if (ex.days_remaining === 0) {
      daysLabel = 'Exam Today!';
      isUrgent = true;
    }

    return `
      <div class="exam-card" id="exam-${ex.id}">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <span class="exam-countdown-badge ${isUrgent ? 'urgent' : ''}">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${daysLabel}
            </span>
            <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="deleteExam(${ex.id})" title="Delete">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
          <h3 class="exam-title">${escapeHTML(ex.exam_name)}</h3>
          <p class="exam-subject">${escapeHTML(ex.subject)}</p>
        </div>
        <div class="exam-details-list">
          <div class="exam-detail-row">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span>Date: <strong>${ex.exam_date_str}</strong></span>
          </div>
          <div class="exam-detail-row">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Time: <strong>${ex.exam_time_str || 'TBD'}</strong></span>
          </div>
          ${ex.venue ? `
            <div class="exam-detail-row">
              <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Venue: <strong>${escapeHTML(ex.venue)}</strong></span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function initExamForm() {
  const form = document.getElementById('examForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const exam_name = document.getElementById('examName').value.trim();
    const subject = document.getElementById('examSubject').value.trim();
    const exam_date = document.getElementById('examDate').value;
    const exam_time = document.getElementById('examTime').value;
    const venue = document.getElementById('examVenue').value.trim();

    if (!exam_name || !subject || !exam_date || !exam_time) {
      showToast('Please fill in exam name, subject, date, and time.', 'error');
      return;
    }

    const res = await fetchAPI('/api/exams', {
      method: 'POST',
      body: JSON.stringify({ exam_name, subject, exam_date, exam_time, venue })
    });

    if (res && res.success) {
      showToast(res.message, 'success');
      closeModal('examModal');
      form.reset();
      loadExams();
    } else if (res) {
      showToast(res.message || 'Failed to add exam.', 'error');
    }
  });
}

function openAddExamModal() {
  const form = document.getElementById('examForm');
  if (form) form.reset();
  openModal('examModal');
}

async function deleteExam(id) {
  if (!confirm('Are you sure you want to delete this exam schedule?')) return;

  const res = await fetchAPI(`/api/exams/${id}`, { method: 'DELETE' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadExams();
  }
}
