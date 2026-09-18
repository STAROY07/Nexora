# NEXORA - Student Utility & Productivity Platform

**NEXORA** is a full-stack, web-based productivity and utility platform built for college students. It provides a centralized, modern workspace to manage all core academic and personal activities in one place.

---

## 🚀 Key Features

1. **Overview Dashboard**: Instant visibility into active tasks, pending assignments, upcoming exams, recent notes, and current month expenses.
2. **Task Manager (To-Do)**: Daily study targets with Priority levels (Low, Medium, High), due dates, status filtering, and quick completion toggling.
3. **Assignment Tracker**: Coursework deadlines by subject with dynamic countdown chips (`X Days Left`, `Due Today`, `Overdue`) and submission tracking.
4. **Notes Manager**: Subject-wise revision notes with instant live search, subject filters, and important/starred bookmarks.
5. **Weekly Timetable**: Responsive class schedule organized across 7 days with start/end lecture times and classroom/lab numbers.
6. **Exam Planner & Countdown**: Schedule unit tests, practicals, and semester finals with live days-remaining countdown badges.
7. **Personal Expense Tracker**: Monthly student budget tracker categorized by Food, Travel, College, Shopping, and Other, with visual percentage breakdown bars.
8. **Progress & Productivity**: Visual completion rate metrics for tasks and assignments, plus subject-wise academic distribution.
9. **Student Profile & Settings**: Manage student degree/semester details, update password, and secure session management.
10. **Data Isolation**: Strict user-specific foreign keys (`user_id`) ensuring every student only views and manages their own data.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), Vanilla JavaScript (ES6+)
- **Backend**: Python 3.12, Flask 3.0+
- **Database**: MySQL 8.0+ (PyMySQL driver)
- **Security**: Werkzeug Secure Password Hashing, Parameterized SQL Queries, Server-side Flask Sessions
- **Assets**: Custom NEXORA branding & SVG icons

> *Note: Built entirely without heavy frameworks (No React, No Tailwind, No Node.js, No TypeScript) so the code remains clean, transparent, and easy for computer science students to understand and defend in viva exams.*

---

## 📁 Project Structure

```
NEXORA/
│
├── backend/
│   ├── app.py                # Main Flask application & page route controller
│   ├── config.py             # Configuration & environment variable loader
│   ├── database.py           # MySQL connection helpers & parameterized queries
│   └── routes/
│       ├── auth_routes.py    # Registration, Login, Logout, Profile routes
│       └── api_routes.py     # REST API for Tasks, Assignments, Notes, Timetable, Exams, Expenses
│
├── frontend/
│   ├── index.html            # Public Landing Page
│   ├── login.html            # Student Login
│   ├── register.html         # Student Registration
│   ├── dashboard.html        # Main Overview Dashboard
│   ├── tasks.html            # Task / To-Do Manager
│   ├── assignments.html      # Coursework Assignment Tracker
│   ├── notes.html            # Notes Manager (Search & Starred)
│   ├── timetable.html        # Weekly Schedule Layout
│   ├── exams.html            # Exam Planner & Countdowns
│   ├── expenses.html         # Monthly Expense Tracker
│   ├── progress.html         # Progress & Analytics Overview
│   ├── profile.html          # Account Profile & Password Settings
│   │
│   ├── css/
│   │   └── style.css         # Unified dark modern stylesheet & media queries
│   │
│   ├── js/
│   │   ├── main.js           # Shared utilities (toast alerts, modals, drawer)
│   │   ├── auth.js           # Authentication & Profile script
│   │   ├── dashboard.js      # Dashboard data rendering
│   │   ├── tasks.js          # Task manager CRUD & filters
│   │   ├── assignments.js    # Assignment tracker & countdowns
│   │   ├── notes.js          # Notes manager & live search
│   │   ├── timetable.js      # Timetable week organizer
│   │   ├── exams.js          # Exam planner & countdown badges
│   │   ├── expenses.js       # Expense calculation & category bars
│   │   └── progress.js       # Progress completion charts
│   │
│   └── assets/
│       └── nexora-logo.png   # Official NEXORA logo
│
├── database/
│   └── nexora.sql            # MySQL schema file with CREATE TABLE IF NOT EXISTS
│
├── .env                      # Local environment configuration
├── .env.example              # Sample environment configuration template
├── requirements.txt          # Python dependencies
└── README.md                 # Project documentation
```

---

## ⚙️ Installation & Setup Guide

### 1. Prerequisites
- **Python 3.10+** installed on your system
- **MySQL Server** installed and running (e.g. MySQL Community Server or XAMPP)

### 2. Configure Environment Variables
Open or create the `.env` file in the project root:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=nexora
DB_PORT=3306

SECRET_KEY=nexora_student_platform_super_secret_key_2026
FLASK_DEBUG=1
PORT=5000
```

### 3. Install Python Dependencies
Open your terminal in the project folder and run:
```bash
pip install -r requirements.txt
```

### 4. Database Setup
The application automatically creates all required tables on startup!  
Alternatively, you can manually import the schema via MySQL CLI:
```bash
mysql -u root -p < database/nexora.sql
```

### 5. Run the Application
Start the Flask development server:
```bash
python -m backend.app
```
*(or run `python backend/app.py`)*

Open your browser and navigate to:
```
http://localhost:5000
```

---

## 📱 Responsive Layouts & Breakpoints

NEXORA is engineered to adapt smoothly across all screen sizes:
- **Mobile (320px – 767px)**: Touch-friendly hamburger drawer, 1-column cards, stacked timetable, full-screen modals.
- **Tablet (768px – 1023px)**: 2-column dashboard grids, horizontally scrollable timetable day columns.
- **Laptop & Desktop (1024px – 1440px+)**: Fixed sidebar navigation, sticky topbar, multi-column analytics grid.

---

## 🎓 College Viva & Submission Notes

- **Architecture**: Simple 3-tier architecture (Presentation: HTML5/CSS3/JS, Logic: Python Flask REST APIs, Storage: MySQL Database).
- **Security**: Passwords hashed using `werkzeug.security` (PBKDF2/SHA-256). All database queries utilize `%s` parameterized arguments to completely prevent SQL injection vulnerabilities.
- **Session Management**: Server-side Flask session cookies keep students logged in and isolate student data.

---

## 📜 License
Developed as a College Mini Project for educational purposes.
