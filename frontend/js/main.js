/**
 * NEXORA - Student Utility & Productivity Platform
 * Main Frontend Script: Navigation, LocalStorage Fallback Store, and Common Utilities
 */

const DATA_STORAGE_VERSION = 'nexora_data_v4';

document.addEventListener('DOMContentLoaded', () => {
  initLocalStorageData();
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
  name: 'Aditiya Singh',
  email: 'demo@nexora.com',
  course: 'BSc Computer Science',
  semester: 'Semester 4',
  created_at: '2026-01-10 09:30'
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
      { id: 1, title: 'Complete DBMS Normalization Problem Set (3NF & BCNF)', description: 'Solve textbook exercises from Chapter 4 and create decomposition trees.', priority: 'High', due_date: addDays(1), status: 'Pending' },
      { id: 2, title: 'Implement Dijkstra Shortest Path Algorithm in Python', description: 'Write unit tests and test with adjacency matrix for Algorithms Lab.', priority: 'Medium', due_date: addDays(3), status: 'Pending' },
      { id: 3, title: 'Review Operating Systems Virtual Memory Paging slides', description: 'Lecture 12-14 revision on TLB hit ratio and Page Fault handling.', priority: 'Low', due_date: addDays(0), status: 'Completed' },
      { id: 4, title: 'Prepare Web Development Mini-Project Demo & Viva Slides', description: 'Test full-stack application workflow and document ER diagrams.', priority: 'High', due_date: addDays(2), status: 'Pending' },
      { id: 5, title: 'Submit Computer Networks Wireshark Packet Analysis Report', description: 'Analyze TCP 3-way handshake and DNS query packets capture files.', priority: 'High', due_date: addDays(4), status: 'Pending' },
      { id: 6, title: 'Buy Reference Book: Computer Networks (Tanenbaum 5th Ed)', description: 'Visit college library or bookstore for semester reference book.', priority: 'Low', due_date: addDays(5), status: 'Completed' }
    ],
    assignments: [
      { id: 1, title: 'CPU Scheduling Algorithms Lab Simulation', subject: 'Operating Systems', description: 'Simulate Round Robin, FCFS, and Priority scheduling algorithms in C/Python with Gantt chart calculation.', submission_date: addDays(3), status: 'Pending' },
      { id: 2, title: 'SQL Schema Design & Relational ER Model for E-Commerce', subject: 'DBMS', description: 'Design 3NF relational schema with primary keys, foreign keys, triggers, and sample analytical queries.', submission_date: addDays(7), status: 'Pending' },
      { id: 3, title: 'TCP/IP Multi-Client Chat Server in Python', subject: 'Computer Networks', description: 'Implement multi-threaded client-server architecture using socket programming and select module.', submission_date: addDays(12), status: 'Pending' },
      { id: 4, title: 'Software Requirements Specification (SRS) Document', subject: 'Software Engineering', description: 'IEEE 830 standard documentation with functional and non-functional requirements.', submission_date: addDays(-2), status: 'Completed' },
      { id: 5, title: 'Dynamic Programming Problem Set (0/1 Knapsack & LCS)', subject: 'Design & Analysis of Algorithms', description: 'Complete time and space complexity proofs with recursion tree diagrams.', submission_date: addDays(9), status: 'Pending' }
    ],
    notes: [
      { id: 1, title: 'DBMS Indexing: B+ Trees vs Hash Indexing', subject: 'DBMS', content: 'Key Concepts:\n- Clustered Index: Modifies physical storage order of data rows. Only 1 per table.\n- Non-Clustered Index: Separate search key index containing row pointers (RID).\n- B+ Tree Indexing: High fanout, log(N) lookup, all data stored in leaf nodes linked sequentially for fast range scans.\n- Hash Indexing: O(1) exact match lookup, but does NOT support range queries (<, >).', is_important: 1, updated_at: '2026-09-15' },
      { id: 2, title: 'Process Synchronization, Critical Section & Semaphores', subject: 'Operating Systems', content: 'Mutual Exclusion Conditions:\n1. Mutual Exclusion: At most one process in Critical Section.\n2. Progress: Selection of next process cannot be postponed indefinitely.\n3. Bounded Waiting: Bound on number of times other processes enter CS (no starvation).\n\nBinary vs Counting Semaphores.\nClassical IPC Problems: Producer-Consumer, Readers-Writers, Dining Philosophers.', is_important: 1, updated_at: '2026-09-14' },
      { id: 3, title: 'Computer Networks: TCP 3-Way Handshake & Congestion Control', subject: 'Computer Networks', content: 'Connection Establishment:\n1. Client -> Server: SYN (seq = x)\n2. Server -> Client: SYN-ACK (seq = y, ack = x+1)\n3. Client -> Server: ACK (seq = x+1, ack = y+1)\n\nCongestion Control: Slow Start, Congestion Avoidance (AIMD), Fast Retransmit, Fast Recovery on 3 duplicate ACKs.', is_important: 1, updated_at: '2026-09-12' },
      { id: 4, title: 'Asymptotic Notations & Master Theorem Analysis', subject: 'Design & Analysis of Algorithms', content: 'Master Theorem Formulation:\nT(n) = a*T(n/b) + f(n), where a >= 1, b > 1\n\n- Case 1: If f(n) = O(n^(log_b(a) - ε)), then T(n) = Θ(n^log_b(a))\n- Case 2: If f(n) = Θ(n^log_b(a) * log^k(n)), then T(n) = Θ(n^log_b(a) * log^(k+1)(n))\n- Case 3: If f(n) = Ω(n^(log_b(a) + ε)), then T(n) = Θ(f(n))', is_important: 1, updated_at: '2026-09-10' }
    ],
    timetable: [
      { id: 1, day: 'Monday', subject: 'Database Systems', start_time: '09:00', end_time: '10:30', room: 'Room 302' },
      { id: 2, day: 'Monday', subject: 'Operating Systems Lab', start_time: '11:00', end_time: '13:00', room: 'Computer Lab 2' },
      { id: 3, day: 'Tuesday', subject: 'Computer Networks', start_time: '10:00', end_time: '11:30', room: 'Room 205' },
      { id: 4, day: 'Tuesday', subject: 'Design & Analysis of Algorithms', start_time: '12:00', end_time: '13:30', room: 'Room 302' },
      { id: 5, day: 'Wednesday', subject: 'Operating Systems Theory', start_time: '09:30', end_time: '11:00', room: 'Room 302' },
      { id: 6, day: 'Wednesday', subject: 'Web Technologies & Frameworks', start_time: '11:30', end_time: '13:00', room: 'Lab 4' },
      { id: 7, day: 'Thursday', subject: 'Computer Networks Lab', start_time: '09:00', end_time: '11:00', room: 'Network Lab 1' },
      { id: 8, day: 'Thursday', subject: 'Database Management Systems', start_time: '11:30', end_time: '13:00', room: 'Room 302' },
      { id: 9, day: 'Friday', subject: 'Software Engineering', start_time: '10:00', end_time: '11:30', room: 'Room 205' },
      { id: 10, day: 'Friday', subject: 'Technical Seminar & Project Viva', start_time: '12:00', end_time: '13:30', room: 'Seminar Hall B' }
    ],
    exams: [
      { id: 1, exam_name: 'Mid-Term Theory Exam', subject: 'Database Management Systems', exam_date: addDays(14), exam_time: '10:00', venue: 'Exam Hall A', notes: 'Chapters 1-6 (ER Model, SQL, Normalization, Transactions)' },
      { id: 2, exam_name: 'Semester Practical Exam', subject: 'Operating Systems Lab', exam_date: addDays(21), exam_time: '14:00', venue: 'Computer Lab 2', notes: 'Shell Scripting, Process Scheduling, Semaphore programs' },
      { id: 3, exam_name: 'Final Semester Exam', subject: 'Computer Networks', exam_date: addDays(28), exam_time: '10:00', venue: 'Main Auditorium', notes: 'OSI 7 Layers, TCP/IP Suite, Subnetting, Routing Protocols' },
      { id: 4, exam_name: 'Semester Written Exam', subject: 'Design & Analysis of Algorithms', exam_date: addDays(35), exam_time: '14:00', venue: 'Exam Hall B', notes: 'Greedy, Dynamic Programming, Graph Traversals, NP-Completeness' }
    ],
    expenses: [
      { id: 1, category: 'College', amount: 850.00, expense_date: addDays(-1), description: 'Database System Concepts Textbook (Korth 7th Ed)' },
      { id: 2, category: 'Food', amount: 180.00, expense_date: addDays(0), description: 'College Canteen Lunch & Coffee' },
      { id: 3, category: 'Travel', amount: 450.00, expense_date: addDays(-2), description: 'Monthly Metro Card Student Recharge' },
      { id: 4, category: 'College', amount: 320.00, expense_date: addDays(-4), description: 'Practical Lab Files & Spiral Notebooks' },
      { id: 5, category: 'Food', amount: 140.00, expense_date: addDays(-3), description: 'Study Group Evening Snacks & Chai' },
      { id: 6, category: 'Shopping', amount: 650.00, expense_date: addDays(-6), description: 'Scientific Calculator & Pen Pack' },
      { id: 7, category: 'Other', amount: 190.00, expense_date: addDays(-5), description: 'Mini-Project Documentation Printouts' }
    ]
  };
}

function initLocalStorageData(force = false) {
  const currentVer = localStorage.getItem('nexora_version');
  if (force || currentVer !== DATA_STORAGE_VERSION) {
    const seed = getSeedData();
    Object.keys(seed).forEach(key => {
      localStorage.setItem(`nexora_${key}`, JSON.stringify(seed[key]));
    });
    localStorage.setItem('nexora_user', JSON.stringify(DEFAULT_DEMO_USER));
    localStorage.setItem('nexora_version', DATA_STORAGE_VERSION);
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
      initLocalStorageData(true);
      localStorage.setItem('nexora_user', JSON.stringify(DEFAULT_DEMO_USER));
      
      try {
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
      }, 300);
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
      }, 400);
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

/* --- 9. Helper to calculate remaining days --- */
function calcDaysRemaining(targetDateStr) {
  if (!targetDateStr) return { days_left: 0, is_past: false, days_remaining: 0 };
  const target = new Date(targetDateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return {
    days_left: diffDays,
    is_past: diffDays < 0,
    days_remaining: Math.max(0, diffDays)
  };
}

/* --- 10. Robust API Fetch Wrapper with Client-Side Fallback --- */
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

    return handleClientFallback(url, options);
  } catch (error) {
    return handleClientFallback(url, options);
  }
}

/* --- 11. Client-Side Mock Data Engine for Static Hosts & Offline Demo --- */
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

  // 5. Dashboard Summary / Stats
  if (url.includes('/api/dashboard/summary') || url.includes('/api/dashboard/stats')) {
    const tasks = JSON.parse(localStorage.getItem('nexora_tasks') || '[]');
    const assignments = JSON.parse(localStorage.getItem('nexora_assignments') || '[]');
    const exams = JSON.parse(localStorage.getItem('nexora_exams') || '[]');
    const expenses = JSON.parse(localStorage.getItem('nexora_expenses') || '[]');
    const notes = JSON.parse(localStorage.getItem('nexora_notes') || '[]');
    const user = JSON.parse(localStorage.getItem('nexora_user') || 'null') || DEFAULT_DEMO_USER;

    const activeTasks = tasks.filter(t => t.status !== 'Completed').length;
    const pendingAssignments = assignments.filter(a => a.status !== 'Completed').length;
    const monthlyExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const formattedAssignments = assignments.slice(0, 4).map(a => ({
      ...a,
      days_left: calcDaysRemaining(a.submission_date).days_left
    }));

    const formattedExams = exams.slice(0, 4).map(ex => ({
      ...ex,
      exam_date_str: ex.exam_date,
      exam_time_str: ex.exam_time,
      days_remaining: calcDaysRemaining(ex.exam_date).days_remaining,
      is_past: calcDaysRemaining(ex.exam_date).is_past
    }));

    return {
      success: true,
      user_name: user.name || 'Aditiya Singh',
      stats: {
        active_tasks: activeTasks,
        pending_assignments: pendingAssignments,
        upcoming_exams: exams.length,
        monthly_expenses: monthlyExpenses,
        total_notes: notes.length
      },
      today_tasks: tasks.slice(0, 5),
      upcoming_assignments: formattedAssignments,
      upcoming_exams: formattedExams,
      recent_notes: notes.slice(0, 4)
    };
  }

  // 6. Timetable
  if (url.includes('/api/timetable')) {
    let items = JSON.parse(localStorage.getItem('nexora_timetable') || '[]');
    if (method === 'GET') {
      const formatted = items.map(c => ({
        ...c,
        start_time_str: c.start_time,
        end_time_str: c.end_time
      }));
      return { success: true, timetable: formatted };
    }
    if (method === 'POST') {
      const newItem = {
        id: Date.now(),
        day: body.day,
        subject: body.subject,
        start_time: body.start_time,
        end_time: body.end_time,
        room: body.room
      };
      items.push(newItem);
      localStorage.setItem('nexora_timetable', JSON.stringify(items));
      return { success: true, message: 'Class added to timetable!', id: newItem.id };
    }
    if (method === 'DELETE') {
      const idMatch = url.match(/\/api\/timetable\/(\d+)/);
      if (idMatch) {
        items = items.filter(item => item.id !== Number(idMatch[1]));
        localStorage.setItem('nexora_timetable', JSON.stringify(items));
        return { success: true, message: 'Class removed from timetable!' };
      }
    }
  }

  // 7. Exams
  if (url.includes('/api/exams')) {
    let items = JSON.parse(localStorage.getItem('nexora_exams') || '[]');
    if (method === 'GET') {
      const formatted = items.map(ex => {
        const diff = calcDaysRemaining(ex.exam_date);
        return {
          ...ex,
          exam_date_str: ex.exam_date,
          exam_time_str: ex.exam_time,
          days_remaining: diff.days_remaining,
          is_past: diff.is_past
        };
      });
      return { success: true, exams: formatted };
    }
    if (method === 'POST') {
      const newItem = { id: Date.now(), ...body };
      items.unshift(newItem);
      localStorage.setItem('nexora_exams', JSON.stringify(items));
      return { success: true, message: 'Exam scheduled successfully!', id: newItem.id };
    }
    if (method === 'DELETE') {
      const idMatch = url.match(/\/api\/exams\/(\d+)/);
      if (idMatch) {
        items = items.filter(item => item.id !== Number(idMatch[1]));
        localStorage.setItem('nexora_exams', JSON.stringify(items));
        return { success: true, message: 'Exam removed!' };
      }
    }
  }

  // 8. Assignments
  if (url.includes('/api/assignments')) {
    let items = JSON.parse(localStorage.getItem('nexora_assignments') || '[]');
    if (method === 'GET') {
      const formatted = items.map(a => ({
        ...a,
        days_left: calcDaysRemaining(a.submission_date).days_left
      }));
      return { success: true, assignments: formatted };
    }
    if (method === 'POST') {
      const newItem = { id: Date.now(), status: 'Pending', ...body };
      items.unshift(newItem);
      localStorage.setItem('nexora_assignments', JSON.stringify(items));
      return { success: true, message: 'Assignment added successfully!', id: newItem.id };
    }
    if (method === 'PUT' || method === 'PATCH') {
      const idMatch = url.match(/\/api\/assignments\/(\d+)/);
      const itemId = idMatch ? Number(idMatch[1]) : body.id;
      items = items.map(item => item.id === itemId ? { ...item, ...body } : item);
      localStorage.setItem('nexora_assignments', JSON.stringify(items));
      return { success: true, message: 'Assignment updated!' };
    }
    if (method === 'DELETE') {
      const idMatch = url.match(/\/api\/assignments\/(\d+)/);
      if (idMatch) {
        items = items.filter(item => item.id !== Number(idMatch[1]));
        localStorage.setItem('nexora_assignments', JSON.stringify(items));
        return { success: true, message: 'Assignment deleted!' };
      }
    }
  }

  // 9. Expenses
  if (url.includes('/api/expenses')) {
    let items = JSON.parse(localStorage.getItem('nexora_expenses') || '[]');
    
    // Toggle / Delete / Create / Update
    if (method === 'POST') {
      const newItem = { id: Date.now(), ...body };
      items.unshift(newItem);
      localStorage.setItem('nexora_expenses', JSON.stringify(items));
      return { success: true, message: 'Expense recorded!', id: newItem.id };
    }
    if (method === 'PUT' || method === 'PATCH') {
      const idMatch = url.match(/\/api\/expenses\/(\d+)/);
      const itemId = idMatch ? Number(idMatch[1]) : body.id;
      items = items.map(item => item.id === itemId ? { ...item, ...body } : item);
      localStorage.setItem('nexora_expenses', JSON.stringify(items));
      return { success: true, message: 'Expense updated!' };
    }
    if (method === 'DELETE') {
      const idMatch = url.match(/\/api\/expenses\/(\d+)/);
      if (idMatch) {
        items = items.filter(item => item.id !== Number(idMatch[1]));
        localStorage.setItem('nexora_expenses', JSON.stringify(items));
        return { success: true, message: 'Expense deleted!' };
      }
    }

    // GET
    const formatted = items.map(e => ({
      ...e,
      expense_date_str: e.expense_date
    }));
    const total = items.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Build category summary
    const catMap = {};
    items.forEach(e => {
      const cat = e.category || 'Other';
      if (!catMap[cat]) catMap[cat] = { category: cat, count: 0, total: 0 };
      catMap[cat].count += 1;
      catMap[cat].total += Number(e.amount || 0);
    });

    return {
      success: true,
      expenses: formatted,
      total_amount: total,
      month_total: total,
      category_summary: Object.values(catMap)
    };
  }

  // 10. Tasks & Notes generic CRUD + Task Toggle
  if (url.includes('/api/tasks') && url.includes('/toggle')) {
    let tasks = JSON.parse(localStorage.getItem('nexora_tasks') || '[]');
    const idMatch = url.match(/\/api\/tasks\/(\d+)\/toggle/);
    if (idMatch) {
      const taskId = Number(idMatch[1]);
      tasks = tasks.map(t => t.id === taskId ? { ...t, status: t.status === 'Completed' ? 'Pending' : 'Completed' } : t);
      localStorage.setItem('nexora_tasks', JSON.stringify(tasks));
      return { success: true, message: 'Task status updated!' };
    }
  }

  const simpleCols = ['tasks', 'notes'];
  for (const col of simpleCols) {
    if (url.includes(`/api/${col}`)) {
      let items = JSON.parse(localStorage.getItem(`nexora_${col}`) || '[]');

      if (method === 'GET' && !url.match(new RegExp(`/api/${col}/\\d+`))) {
        return { success: true, [col]: items };
      }

      if (method === 'POST') {
        const newItem = { id: Date.now(), ...body };
        items.unshift(newItem);
        localStorage.setItem(`nexora_${col}`, JSON.stringify(items));
        return { success: true, message: 'Added successfully!', id: newItem.id };
      }

      if (method === 'PUT' || method === 'PATCH') {
        const idMatch = url.match(new RegExp(`/api/${col}/(\\d+)`));
        const itemId = idMatch ? Number(idMatch[1]) : body.id;
        items = items.map(item => item.id === itemId ? { ...item, ...body } : item);
        localStorage.setItem(`nexora_${col}`, JSON.stringify(items));
        return { success: true, message: 'Updated successfully!' };
      }

      if (method === 'DELETE') {
        const idMatch = url.match(new RegExp(`/api/${col}/(\\d+)`));
        if (idMatch) {
          items = items.filter(item => item.id !== Number(idMatch[1]));
          localStorage.setItem(`nexora_${col}`, JSON.stringify(items));
          return { success: true, message: 'Deleted successfully!' };
        }
      }
    }
  }

  // 11. Progress Summary
  if (url.includes('/api/progress/summary')) {
    const tasks = JSON.parse(localStorage.getItem('nexora_tasks') || '[]');
    const assignments = JSON.parse(localStorage.getItem('nexora_assignments') || '[]');
    const expenses = JSON.parse(localStorage.getItem('nexora_expenses') || '[]');

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const taskPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalAssign = assignments.length;
    const completedAssign = assignments.filter(a => a.status === 'Completed').length;
    const assignPct = totalAssign ? Math.round((completedAssign / totalAssign) * 100) : 0;

    // Subject breakdown for assignments
    const subMap = {};
    assignments.forEach(a => {
      const s = a.subject || 'General';
      if (!subMap[s]) subMap[s] = { subject: s, total: 0, completed: 0 };
      subMap[s].total += 1;
      if (a.status === 'Completed') subMap[s].completed += 1;
    });

    const bySubject = Object.values(subMap).map(s => ({
      ...s,
      rate: s.total ? Math.round((s.completed / s.total) * 100) : 0
    }));

    // Expense breakdown
    const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const catMap = {};
    expenses.forEach(e => {
      const cat = e.category || 'Other';
      if (!catMap[cat]) catMap[cat] = { category: cat, total: 0 };
      catMap[cat].total += Number(e.amount || 0);
    });

    return {
      success: true,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        percentage: taskPct
      },
      assignments: {
        total: totalAssign,
        completed: completedAssign,
        pending: totalAssign - completedAssign,
        percentage: assignPct,
        by_subject: bySubject
      },
      expenses: {
        total: totalExp,
        categories: Object.values(catMap)
      }
    };
  }

  return { success: true };
}

/* --- 12. Helper: Escape HTML to prevent XSS --- */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
