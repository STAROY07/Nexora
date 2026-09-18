/**
 * NEXORA - Student Utility & Productivity Platform
 * Main Frontend Script: Navigation, Toast Notifications, Modal Utilities, and Common Helpers
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileDrawer();
  initActiveNavLink();
  initTodayDateChip();
  initLogoutHandlers();
});

/* --- 1. Mobile Sidebar Navigation Drawer --- */
function initMobileDrawer() {
  const toggleBtn = document.getElementById('mobileMenuToggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');

  if (toggleBtn && sidebar && overlay) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

/* --- 2. Active Sidebar Link Highlighting --- */
function initActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && (href === currentPath || (currentPath === '/' && href === '/dashboard'))) {
      link.classList.add('active');
    }
  });
}

/* --- 3. Current Date Display in Top Bar --- */
function initTodayDateChip() {
  const dateChip = document.getElementById('todayDateDisplay');
  if (dateChip) {
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    dateChip.textContent = new Date().toLocaleDateString('en-US', options);
  }
}

/* --- 4. Global Logout Handlers --- */
function initLogoutHandlers() {
  const logoutButtons = document.querySelectorAll('.logout-trigger');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          showToast('Logged out successfully', 'info');
          setTimeout(() => {
            window.location.href = '/login';
          }, 600);
        }
      } catch (err) {
        window.location.href = '/login';
      }
    });
  });
}

/* --- 5. Modal Show / Hide Helpers --- */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    // autofocus first input inside modal
    const firstInput = modal.querySelector('input, textarea, select');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Close modal when clicking outside modal-card
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
  }
});

/* --- 6. Toast Notifications --- */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* --- 7. Generic API Fetch Wrapper --- */
async function fetchAPI(url, options = {}) {
  try {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    options.headers = { ...defaultHeaders, ...(options.headers || {}) };

    const response = await fetch(url, options);

    // If session expired or unauthorized, redirect to login
    if (response.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
      window.location.href = '/login';
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Fetch Error:', error);
    showToast('Failed to connect to server. Check database / connection.', 'error');
    return null;
  }
}

/* --- 8. Helper: Escape HTML to prevent XSS --- */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
