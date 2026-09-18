/**
 * NEXORA - Notes Manager JavaScript (SVG Icon Edition)
 * Handles note CRUD, subject categorization, search filter, and important flags.
 */

let currentSubjectFilter = 'All';
let showImportantOnly = false;
let editingNoteId = null;
let notesCache = [];

document.addEventListener('DOMContentLoaded', () => {
  loadNotes();
  initNoteSearch();
  initNoteForm();
});

async function loadNotes() {
  const container = document.getElementById('notesGridContainer');
  if (!container) return;

  const searchVal = document.getElementById('noteSearchInput') ? document.getElementById('noteSearchInput').value.trim() : '';
  const url = `/api/notes?subject=${encodeURIComponent(currentSubjectFilter)}&important=${showImportantOnly}&search=${encodeURIComponent(searchVal)}`;
  
  const data = await fetchAPI(url);
  if (!data || !data.success) {
    container.innerHTML = `<div class="empty-state"><p class="empty-description">Failed to load notes.</p></div>`;
    return;
  }

  notesCache = data.notes || [];
  updateSubjectDropdown(data.subjects || []);

  if (notesCache.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        </div>
        <h3 class="empty-title">No notes found</h3>
        <p class="empty-description">Create study notes, revision summaries, and lecture pointers.</p>
        <button class="btn btn-primary btn-sm" onclick="openAddNoteModal()">+ Create Note</button>
      </div>
    `;
    return;
  }

  container.innerHTML = notesCache.map(n => `
    <div class="note-card ${n.is_important ? 'important' : ''}" id="note-${n.id}" onclick="viewNoteDetails(${n.id})">
      <div class="note-header">
        <span class="badge badge-subject">${escapeHTML(n.subject)}</span>
        <div style="display: flex; align-items: center; gap: 8px;" onclick="event.stopPropagation();">
          <span class="star-icon-btn ${n.is_important ? 'starred' : ''}" onclick="toggleNoteFavorite(${n.id})" title="Toggle Important">
            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
          <button class="btn btn-ghost btn-sm" onclick='openEditNoteModal(${JSON.stringify(n)})' title="Edit">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" style="color: var(--danger);" onclick="deleteNote(${n.id})" title="Delete">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      <h3 class="note-title">${escapeHTML(n.title)}</h3>
      <p class="note-preview">${escapeHTML(n.content)}</p>
      <div class="note-footer">
        <span>${n.updated_at || n.created_at}</span>
        <span style="color: var(--primary); font-weight: 700;">Read More →</span>
      </div>
    </div>
  `).join('');
}

function updateSubjectDropdown(subjects) {
  const select = document.getElementById('noteSubjectFilter');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = `<option value="All">All Subjects</option>` +
    subjects.map(s => `<option value="${escapeHTML(s)}" ${s === currentVal ? 'selected' : ''}>${escapeHTML(s)}</option>`).join('');
}

function initNoteSearch() {
  const searchInput = document.getElementById('noteSearchInput');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        loadNotes();
      }, 300);
    });
  }

  const subjectFilter = document.getElementById('noteSubjectFilter');
  if (subjectFilter) {
    subjectFilter.addEventListener('change', (e) => {
      currentSubjectFilter = e.target.value;
      loadNotes();
    });
  }

  const importantToggle = document.getElementById('importantNotesToggle');
  if (importantToggle) {
    importantToggle.addEventListener('click', () => {
      showImportantOnly = !showImportantOnly;
      importantToggle.classList.toggle('active', showImportantOnly);
      loadNotes();
    });
  }
}

function initNoteForm() {
  const form = document.getElementById('noteForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('noteTitleInput').value.trim();
    const subject = document.getElementById('noteSubjectInput').value.trim();
    const content = document.getElementById('noteContentInput').value.trim();
    const is_important = document.getElementById('noteImportantInput').checked;

    if (!title || !content) {
      showToast('Title and content are required.', 'error');
      return;
    }

    let res;
    if (editingNoteId) {
      res = await fetchAPI(`/api/notes/${editingNoteId}`, {
        method: 'PUT',
        body: JSON.stringify({ title, subject, content, is_important })
      });
    } else {
      res = await fetchAPI('/api/notes', {
        method: 'POST',
        body: JSON.stringify({ title, subject, content, is_important })
      });
    }

    if (res && res.success) {
      showToast(res.message, 'success');
      closeModal('noteModal');
      form.reset();
      editingNoteId = null;
      loadNotes();
    } else if (res) {
      showToast(res.message || 'Failed to save note.', 'error');
    }
  });
}

function openAddNoteModal() {
  editingNoteId = null;
  const form = document.getElementById('noteForm');
  if (form) form.reset();

  const titleEl = document.getElementById('noteModalTitle');
  if (titleEl) titleEl.textContent = 'Create New Note';

  openModal('noteModal');
}

function openEditNoteModal(n) {
  editingNoteId = n.id;

  document.getElementById('noteTitleInput').value = n.title || '';
  document.getElementById('noteSubjectInput').value = n.subject || '';
  document.getElementById('noteContentInput').value = n.content || '';
  document.getElementById('noteImportantInput').checked = !!n.is_important;

  const titleEl = document.getElementById('noteModalTitle');
  if (titleEl) titleEl.textContent = 'Edit Note';

  openModal('noteModal');
}

function viewNoteDetails(noteId) {
  const note = notesCache.find(n => n.id === noteId);
  if (!note) return;

  document.getElementById('viewNoteSubject').textContent = note.subject;
  document.getElementById('viewNoteTitle').textContent = note.title;
  document.getElementById('viewNoteContent').textContent = note.content;
  document.getElementById('viewNoteDate').textContent = note.updated_at || note.created_at;

  openModal('viewNoteModal');
}

async function toggleNoteFavorite(id) {
  const res = await fetchAPI(`/api/notes/${id}/favorite`, { method: 'PATCH' });
  if (res && res.success) {
    loadNotes();
  }
}

async function deleteNote(id) {
  if (!confirm('Are you sure you want to delete this note?')) return;

  const res = await fetchAPI(`/api/notes/${id}`, { method: 'DELETE' });
  if (res && res.success) {
    showToast(res.message, 'success');
    loadNotes();
  }
}
