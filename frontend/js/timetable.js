/**
 * NEXORA - Timetable JavaScript (SVG Icon Edition)
 * Organizes weekly lecture schedule into day columns with start/end time and rooms.
 */

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

document.addEventListener('DOMContentLoaded', () => {
  loadTimetable();
  initTimetableForm();
});

async function loadTimetable() {
  const container = document.getElementById('timetableGridContainer');
  if (!container) return;

  const data = await fetchAPI('/api/timetable');
  if (!data || !data.success) {
    container.innerHTML = `<div class="empty-state"><p class="empty-description">Failed to load timetable.</p></div>`;
    return;
  }

  const entries = data.timetable || [];

  // Group classes by day
  const dayGroups = {};
  DAYS_OF_WEEK.forEach(day => {
    dayGroups[day] = [];
  });

  entries.forEach(entry => {
    if (dayGroups[entry.day]) {
      dayGroups[entry.day].push(entry);
    }
  });

  container.innerHTML = DAYS_OF_WEEK.map(day => {
    const classes = dayGroups[day];
    const classesHTML = classes.length === 0 
      ? `<p style="font-size: 0.78rem; color: var(--text-dim); text-align: center; margin-top: 20px;">No classes</p>`
      : classes.map(c => `
          <div class="class-slot-card">
            <span class="slot-delete-btn" onclick="deleteTimetableEntry(${c.id})" title="Remove class">✕</span>
            <div class="class-subject">${escapeHTML(c.subject)}</div>
            <div class="class-time">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${c.start_time_str} - ${c.end_time_str}
            </div>
            ${c.room ? `
              <div class="class-room">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${escapeHTML(c.room)}
              </div>
            ` : ''}
          </div>
        `).join('');

    return `
      <div class="day-column">
        <div class="day-column-header">${day}</div>
        <div class="class-slots-list">
          ${classesHTML}
        </div>
      </div>
    `;
  }).join('');
}

function initTimetableForm() {
  const form = document.getElementById('timetableForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const day = document.getElementById('ttDay').value;
    const subject = document.getElementById('ttSubject').value.trim();
    const start_time = document.getElementById('ttStartTime').value;
    const end_time = document.getElementById('ttEndTime').value;
    const room = document.getElementById('ttRoom').value.trim();

    if (!day || !subject || !start_time || !end_time) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    const res = await fetchAPI('/api/timetable', {
      method: 'POST',
      body: JSON.stringify({ day, subject, start_time, end_time, room })
    });

    if (res && res.success) {
      showToast(res.message, 'success');
      closeModal('timetableModal');
      form.reset();
      loadTimetable();
    } else if (res) {
      showToast(res.message || 'Failed to add class.', 'error');
    }
  });
}

function openAddTimetableModal(defaultDay = 'Monday') {
  const form = document.getElementById('timetableForm');
  if (form) form.reset();

  const daySelect = document.getElementById('ttDay');
  if (daySelect && defaultDay) daySelect.value = defaultDay;

  openModal('timetableModal');
}

async function deleteTimetableEntry(id) {
  if (!confirm('Remove this class from your timetable?')) return;

  const res = await fetchAPI(`/api/timetable/${id}`, { method: 'DELETE' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadTimetable();
  }
}
