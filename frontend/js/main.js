/**
 * NEXORA - Student Utility & Productivity Platform
 * Main Frontend Script: Navigation, Demo Access, Storage Fallback, and Common Utilities
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileDrawer();
  initActiveNavLink();
  initTodayDateChip();
  initLogoutHandlers();
  initDemoLoginButtons();
  initUserInfoHeader();
});

/* --- Sample Seed Data for Static Hosting (Netlify) & Offline Demo --- */
const DEFAULT_DEMO_USER = {
  id: 1,
  name: 'Aditiya Singh (Demo)',
  email: 'demo@nexora.com',
  course: 'BSc Computer Science',
  semester: 'Semester 4',
  created_at: '2026-01-15 10:00'
};

function getSeedData() {
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  const addDays = (n) => {
    const d = new Date();
    d.setDate(today.getDate() + n);
    return formatDate(d);
  };

  return {
    tasks: [
      { id: 1, title: 'Complete DBMS Normalization Exercises (3NF & BCNF)', description: 'Solve problem set from Chapter 4 textbook', priority: 'High', due_date: addDays(1), status: 'Pending' },
      { id: 2, title: 'Implement Dijkstra Algorithm in Python', description: 'Graph theory lab practice for algorithms class', priority: 'Medium', due_date: addDays(3), status: 'Pending' },
      { id: 3, title: 'Review Operating Systems Virtual Memory Paging slides', description: 'Lecture 12-14 revision for next class', priority: 'Low', due_date: addDays(0), status: 'Completed' },
      { id: 4, title: 'Submit Web Development Mini Project Proposal', description: 'Prepare documentation and architecture diagram', priority: 'High', due_date: addDays(2), status: 'Pending' },
      { id: 5, title: 'Buy reference books for Computer Networks', description: 'Andrew Tanenbaum 5th edition', priority: 'Low', due_date: addDays(5), status: 'Completed' }
    ],
    assignments: [
      { id: 1, title: 'CPU Scheduling Algorithms Lab Report', subject: 'Operating Systems', description: 'Document Round Robin and FCFS simulation outputs with Gantt charts.', submission_date: addDays(3), status: 'Pending' },
      { id: 2, title: 'SQL Schema Design & ER Diagram for Library Management', subject: 'DBMS', description: 'Design relational schema with DDL queries, primary keys, and foreign keys.', submission_date: addDays(7), status: 'Pending' },
      { id: 3, title: 'Socket Programming TCP/IP Client-Server in C', subject: 'Computer Networks', description: 'Implement multi-client chat server using POSIX sockets.', submission_date: addDays(12), status: 'Pending' },
      { id: 4, title: 'Software Requirement Specification (SRS) Document', subject: 'Software Engineering', description: 'IEEE format specification for student management app.', submission_date: addDays(-2), status: 'Completed' }
    ],
    notes: [
      { id: 1, title: 'Database Indexing & B+ Trees', subject: 'DBMS', content: 'Key Concepts:\n- Clustered Index: Determines physical order of data rows.\n- Non-Clustered Index: Contains pointers to data rows.\n- B+ Trees: High fanout, all data stored in leaf nodes linked sequentially.', is_important: 1, updated_at: '2026-09-15' },
      { id: 2, title: 'Process Synchronization & Semaphores', subject: 'Operating Systems', content: 'Mutual Exclusion Conditions:\n1. No two processes inside Critical Section simultaneously.\n2. No assumptions about CPU speeds.\n3. Starvation freedom.\n\nBinary vs Counting Semaphores.', is_important: 1, updated_at: '2026-09-14' },
      { id: 3, title: 'TCP 3-Way Handshake & Congestion Control', subject: 'Computer Networks', content: 'Connection Setup:\n1. SYN (seq = x)\n2. SYN-ACK (seq = y, ack = x+1)\n3. ACK (seq = x+1, ack = y+1)', is_important: 0, updated_at: '2026-09-12' },
      { id: 4, title: 'Asymptotic Notations & Master Theorem', subject: 'Design & Analysis of Algorithms', content: 'T(n) = aT(n/b) + f(n)\n- Case 1: Theta(n^log_b(a))\n- Case 2: Theta(n^log_b(a) * log^k(n))\n- Case 3: Omega(n^(log_b(a) + e))', is_important: 1, updated_at: '2026-09-10' }
    ],
    timetable: [
      { id: 1, day_of_week: 'Monday', subject: 'Database Systems', start_time: '09:00', end_time: '10:30', room: 'Room 302' },
      { id: 2, day_of_week: 'Monday', subject: 'Operating Systems Lab', start_time: '11:00', end_time: '13:00', room: 'Lab 2' },
      { id: 3, day_of_week: 'Tuesday', subject: 'Computer Networks', start_time: '10:00', end_time: '11:30', room: 'Room 205' },
      { id: 4, day_of_week: 'Tuesday', subject: 'Data Structures & Algorithms', start_time: '12:00', end_time: '13:30', room: 'Room 302' },
      { id: 5, day_of_week: 'Wednesday', subject: 'Operating Systems', start_time: '09:30', end_time: '11:00', room: 'Room 302' },
      { id: 6, day_of_week: 'Wednesday', subject: 'Web Technologies', start_time: '11:30', end_time: '13:00', room: 'Lab 4' },
      { id: 7, day_of_week: 'Thursday', subject: 'Computer Networks Lab', start_time: '09:00', end_time: '11:00', room: 'Lab 1' },
      { id: 8, day_of_week: 'Thursday', subject: 'Database Systems', start_time: '11:30', end_time: '13:00', room: 'Room 302' },
      { id: 9, day_of_week: 'Friday', subject: 'Software Engineering', start_time: '10:00', end_time: '11:30', room: 'Room 205' },
      { id: 10, day_of_week: 'Friday', subject: 'Algorithms Seminar', start_time: '12:00', end_time: '13:30', room: 'Seminar Hall B' }
    ],
    exams: [
      { id: 1, subject: 'Database Management Systems', exam_date: addDays(14), start_time: '10:00', room: 'Exam Hall A', notes: 'Chapters 1-6 (Relational Algebra, SQL, Normalization, Transactions)' },
      { id: 2, subject: 'Operating Systems & Architecture', exam_date: addDays(21), start_time: '14:00', room: 'Exam Hall B', notes: 'Processes, CPU Scheduling, Memory Management, File Systems' },
      { id: 3, subject: 'Computer Networks & Protocols', exam_date: addDays(28), start_time: '10:00', room: 'Exam Hall A', notes: 'OSI Model, TCP/IP, Routing Algorithms, Network Security' }
    ],
    expenses: [
      { id: 1, category: 'College', amount: 850.00, expense_date: addDays(-2), description: 'College Textbook: DBMS 7th Edition' },
      { id: 2, category: 'Food', amount: 240.00, expense_date: addDays(-1), description: 'College Canteen Lunch & Coffee' },
      { id: 3, category: 'Travel', amount: 150.00, expense_date: addDays(0), description: 'Metro Pass Weekly Recharge' },
      { id: 4, category: 'College', amount: 350.00, expense_date: addDays(-5), description: 'Lab Stationery, Files & Spiral Notebooks' },
      { id: 5, category: 'Food', amount: 180.00, expense_date: addDays(-3), description: 'Study Group Snacks & Tea' }
    ]
  };
}

function initLocalStorageData() {
  if (!localStorage.getItem('nexora_initialized')) {
    const seed = getSeedData();
    Object.keys(seed).forEach(key => {
      localStorage.setItem(`nexora_${key}`, JSON.stringify(seed[key]));
    });
    localStorage.setItem('nexora_user', JSON.stringify(DEFAULT_DEMO_USER));
    localStorage.setItem('nexora_initialized', 'true');
  }
}

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
    if (href && (href === currentPath || href + '.html' === currentPath || (currentPath === '/' && href === '/dashboard'))) {
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

/* --- 4. User Info Header in Sidebar & Topbar --- */
function initUserInfoHeader() {
  const user = JSON.parse(localStorage.getItem('nexora_user') || 'null') || DEFAULT_DEMO_USER;
  const nameEl = document.getElementById('sidebarUserName');
  const avatarEl = document.getElementById('sidebarAvatarBadge');
  const welcomeEl = document.getElementById('welcomeStudentName');

  if (nameEl && user) nameEl.textContent = user.name || 'Student';
  if (avatarEl && user) avatarEl.textContent = (user.name || 'S')[0].toUpperCase();
  if (welcomeEl && user) welcomeEl.textContent = (user.name || 'Student').toUpperCase();
}

/* --- 5. Demo Login Buttons Handler --- */
function initDemoLoginButtons() {
  const demoButtons = document.querySelectorAll('a[href*="demo-login"], .btn-demo');
  demoButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      initLocalStorageData();
      localStorage.setItem('nexora_user', JSON.stringify(DEFAULT_DEMO_USER));
      
      try {
        // Try backend login first if available
        const res = await fetch('/api/auth/demo-login', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) localStorage.setItem('nexora_user', JSON.stringify(data.user));
        }
      } catch (err) {
        // Static host fallback
      }

      showToast('Welcome to Demo Account!', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 400);
    });
  });
}

/* --- 6. Global Logout Handlers --- */
function initLogoutHandlers() {
  const logoutButtons = document.querySelectorAll('.logout-trigger');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        // Static fallback
      }
      localStorage.removeItem('nexora_user');
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    });
  });
}

/* --- 7. Modal Show / Hide Helpers --- */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
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

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('active');
  }
});

/* --- 8. Toast Notifications --- */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* --- 9. Robust API Fetch Wrapper with Client-Side Fallback --- */
async function fetchAPI(url, options = {}) {
  try {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    options.headers = { ...defaultHeaders, ...(options.headers || {}) };

    const response = await fetch(url, options);

    if (response.ok) {
      const data = await response.json();
      return data;
    }

    if (response.status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
      window.location.href = '/login';
      return null;
    }

    // If 404 or backend unavailable (e.g. Netlify), use LocalStorage Mock Engine
    return handleClientFallback(url, options);
  } catch (error) {
    // Network / Offline / Static host fallback
    return handleClientFallback(url, options);
  }
}

/* --- 10. Client-Side Mock Data Engine for Static Hosts --- */
function handleClientFallback(url, options = {}) {
  initLocalStorageData();
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};

  // 1. Auth Me
  if (url.includes('/api/auth/me')) {
    const user = JSON.parse(localStorage.getItem('nexora_user') || 'null') || DEFAULT_DEMO_USER;
    return { success: true, user };
  }

  // 2. Auth Login
  if (url.includes('/api/auth/login')) {
    const user = { id: 1, name: body.email.split('@')[0] || 'Student', email: body.email, course: 'BSc Computer Science', semester: 'Semester 4' };
    localStorage.setItem('nexora_user', JSON.stringify(user));
    return { success: true, message: `Welcome back, ${user.name}!`, user };
  }

  // 3. Auth Register
  if (url.includes('/api/auth/register')) {
    const user = { id: Date.now(), name: body.name, email: body.email, course: body.course, semester: body.semester };
    localStorage.setItem('nexora_user', JSON.stringify(user));
    return { success: true, message: 'Registration successful! Welcome to NEXORA.', user };
  }

  // 4. Auth Profile Update
  if (url.includes('/api/auth/profile')) {
    const current = JSON.parse(localStorage.getItem('nexora_user') || '{}');
    const updated = { ...current, name: body.name || current.name, course: body.course, semester: body.semester };
    localStorage.setItem('nexora_user', JSON.stringify(updated));
    return { success: true, message: 'Profile updated successfully!', user: updated };
  }

  // 5. Dashboard Stats
  if (url.includes('/api/dashboard/stats')) {
    const tasks = JSON.parse(localStorage.getItem('nexora_tasks') || '[]');
    const assignments = JSON.parse(localStorage.getItem('nexora_assignments') || '[]');
    const exams = JSON.parse(localStorage.getItem('nexora_exams') || '[]');
    const expenses = JSON.parse(localStorage.getItem('nexora_expenses') || '[]');
    const notes = JSON.parse(localStorage.getItem('nexora_notes') || '[]');

    const activeTasks = tasks.filter(t => t.status !== 'Completed').length;
    const pendingAssignments = assignments.filter(a => a.status !== 'Completed').length;
    const monthlyExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    return {
      success: true,
      stats: {
        active_tasks: activeTasks,
        pending_assignments: pendingAssignments,
        upcoming_exams: exams.length,
        monthly_expenses: monthlyExpenses,
        total_notes: notes.length
      },
      today_tasks: tasks.slice(0, 4),
      upcoming_assignments: assignments.slice(0, 3),
      upcoming_exams: exams.slice(0, 3),
      recent_notes: notes.slice(0, 3)
    };
  }

  // Helper for generic collection CRUD
  const collections = ['tasks', 'assignments', 'notes', 'timetable', 'exams', 'expenses'];
  for (const col of collections) {
    if (url.includes(`/api/${col}`)) {
      let items = JSON.parse(localStorage.getItem(`nexora_${col}`) || '[]');

      // GET Collection
      if (method === 'GET' && !url.match(new RegExp(`/api/${col}/\\d+`))) {
        return { success: true, [col]: items };
      }

      // POST Create
      if (method === 'POST') {
        const newItem = { id: Date.now(), ...body };
        items.unshift(newItem);
        localStorage.setItem(`nexora_${col}`, JSON.stringify(items));
        return { success: true, message: 'Added successfully!', id: newItem.id };
      }

      // PUT / PATCH Update
      if (method === 'PUT' || method === 'PATCH') {
        const idMatch = url.match(new RegExp(`/api/${col}/(\\d+)`));
        const itemId = idMatch ? Number(idMatch[1]) : body.id;
        items = items.map(item => item.id === itemId ? { ...item, ...body } : item);
        localStorage.setItem(`nexora_${col}`, JSON.stringify(items));
        return { success: true, message: 'Updated successfully!' };
      }

      // DELETE Remove
      if (method === 'DELETE') {
        const idMatch = url.match(new RegExp(`/api/${col}/(\\d+)`));
        if (idMatch) {
          const itemId = Number(idMatch[1]);
          items = items.filter(item => item.id !== itemId);
          localStorage.setItem(`nexora_${col}`, JSON.stringify(items));
          return { success: true, message: 'Deleted successfully!' };
        }
      }
    }
  }

  // Progress Summary
  if (url.includes('/api/progress/summary')) {
    const tasks = JSON.parse(localStorage.getItem('nexora_tasks') || '[]');
    const assignments = JSON.parse(localStorage.getItem('nexora_assignments') || '[]');
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const totalAssign = assignments.length;
    const completedAssign = assignments.filter(a => a.status === 'Completed').length;

    return {
      success: true,
      tasks: { total: totalTasks, completed: completedTasks, pending: totalTasks - completedTasks, completion_rate: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0 },
      assignments: { total: totalAssign, completed: completedAssign, pending: totalAssign - completedAssign, completion_rate: totalAssign ? Math.round((completedAssign / totalAssign) * 100) : 0 },
      recent_activity: tasks.slice(0, 5).map(t => ({ title: t.title, type: 'Task', status: t.status, date: t.due_date }))
    };
  }

  return { success: true };
}

/* --- 11. Helper: Escape HTML to prevent XSS --- */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
