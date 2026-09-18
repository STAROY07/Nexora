import os
import sys

# Ensure root directory is on sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

import pymysql
import pymysql.cursors
from backend.config import Config


def get_db_connection():
    """
    Establishes and returns a new MySQL database connection.
    Uses DictCursor so results can be accessed like Python dictionaries (e.g., row['title']).
    """
    return pymysql.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
        port=Config.DB_PORT,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
        charset='utf8mb4'
    )


def query_db(query, args=(), one=False):
    """
    Executes a SELECT query with parameterized arguments to prevent SQL injection.
    
    :param query: SQL query string with %s placeholders
    :param args: Tuple or list of parameters to substitute into placeholders
    :param one: If True, returns a single dictionary row or None. If False, returns a list of dictionaries.
    :return: List of dicts or single dict
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            result = cursor.fetchall()
            return (result[0] if result else None) if one else result
    finally:
        conn.close()


def execute_db(query, args=()):
    """
    Executes an INSERT, UPDATE, or DELETE query with parameterized arguments.
    
    :param query: SQL query string with %s placeholders
    :param args: Tuple or list of parameters
    :return: The last inserted row ID (for INSERTs) or affected rows count
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, args)
            last_id = cursor.lastrowid
            affected = cursor.rowcount
            # If an INSERT was performed, return the new ID; otherwise return affected rows
            return last_id if last_id > 0 else affected
    finally:
        conn.close()


def init_db():
    """
    Safely creates all necessary tables in the `nexora` database if they don't already exist.
    Preserves all existing tables and data.
    """
    try:
        # First ensure database exists
        conn = pymysql.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            port=Config.DB_PORT,
            autocommit=True,
            charset='utf8mb4'
        )
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` DEFAULT CHARACTER SET utf8mb4;")
        conn.close()

        # Connect to database and create required tables safely
        db_conn = get_db_connection()
        with db_conn.cursor() as cursor:
            # Users table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `users` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `name` VARCHAR(100) NOT NULL,
                    `email` VARCHAR(150) NOT NULL UNIQUE,
                    `password` VARCHAR(255) NOT NULL,
                    `course` VARCHAR(100) DEFAULT NULL,
                    `semester` VARCHAR(20) DEFAULT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB;
            """)

            # Tasks table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `tasks` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `title` VARCHAR(255) NOT NULL,
                    `description` TEXT DEFAULT NULL,
                    `priority` ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
                    `due_date` DATE DEFAULT NULL,
                    `status` ENUM('Pending', 'Completed') DEFAULT 'Pending',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            """)

            # Assignments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `assignments` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `title` VARCHAR(255) NOT NULL,
                    `subject` VARCHAR(100) NOT NULL,
                    `description` TEXT DEFAULT NULL,
                    `submission_date` DATE NOT NULL,
                    `status` ENUM('Pending', 'Completed') DEFAULT 'Pending',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            """)

            # Notes table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `notes` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `title` VARCHAR(255) NOT NULL,
                    `subject` VARCHAR(100) NOT NULL,
                    `content` MEDIUMTEXT NOT NULL,
                    `is_important` TINYINT(1) DEFAULT 0,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            """)

            # Timetable table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `timetable` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `day` ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
                    `subject` VARCHAR(100) NOT NULL,
                    `start_time` TIME NOT NULL,
                    `end_time` TIME NOT NULL,
                    `room` VARCHAR(50) DEFAULT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            """)

            # Exams table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `exams` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `exam_name` VARCHAR(150) NOT NULL,
                    `subject` VARCHAR(100) NOT NULL,
                    `exam_date` DATE NOT NULL,
                    `exam_time` TIME NOT NULL,
                    `venue` VARCHAR(100) DEFAULT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            """)

            # Expenses table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS `expenses` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `category` ENUM('Food', 'Travel', 'College', 'Shopping', 'Other') NOT NULL,
                    `amount` DECIMAL(10, 2) NOT NULL,
                    `expense_date` DATE NOT NULL,
                    `description` VARCHAR(255) DEFAULT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB;
            """)

        db_conn.close()
        print("[OK] Database and all tables verified successfully.")

        # Seed demo student account with sample data if not present
        seed_demo_data()
        return True
    except Exception as e:
        print(f"[ERROR] Database initialization error: {e}")
        return False


def seed_demo_data():
    """
    Seeds a comprehensive demo student account with realistic sample data.
    Email: demo@nexora.com | Password: demo123
    """
    from werkzeug.security import generate_password_hash
    from datetime import date, timedelta

    try:
        demo_email = 'demo@nexora.com'
        user = query_db("SELECT id FROM users WHERE email = %s", (demo_email,), one=True)
        
        if not user:
            # Create demo student
            hashed_pwd = generate_password_hash('demo123')
            user_id = execute_db(
                """
                INSERT INTO users (name, email, password, course, semester)
                VALUES (%s, %s, %s, %s, %s)
                """,
                ('Aditiya Singh (Demo)', demo_email, hashed_pwd, 'BSc Computer Science', 'Semester 4')
            )
            print(f"[INIT] Created demo account: {demo_email} / demo123 (ID: {user_id})")
        else:
            user_id = user['id']

        # Check if demo data already populated
        existing_tasks = query_db("SELECT COUNT(*) as cnt FROM tasks WHERE user_id = %s", (user_id,), one=True)
        if existing_tasks and existing_tasks['cnt'] > 0:
            return  # Already seeded

        today = date.today()

        # 1. Sample Tasks
        sample_tasks = [
            ('Complete DBMS Normalization Exercises (3NF & BCNF)', 'Solve problem set from Chapter 4 textbook', 'High', str(today + timedelta(days=1)), 'Pending'),
            ('Implement Dijkstra Algorithm in Python', 'Graph theory lab practice for algorithms class', 'Medium', str(today + timedelta(days=3)), 'Pending'),
            ('Review Operating Systems Virtual Memory Paging slides', 'Lecture 12-14 revision for next class', 'Low', str(today), 'Completed'),
            ('Submit Web Development Mini Project Proposal', 'Prepare documentation and architecture diagram', 'High', str(today + timedelta(days=2)), 'Pending'),
            ('Buy reference books for Computer Networks', 'Andrew Tanenbaum 5th edition', 'Low', str(today + timedelta(days=5)), 'Completed')
        ]
        for t in sample_tasks:
            execute_db("INSERT INTO tasks (user_id, title, description, priority, due_date, status) VALUES (%s, %s, %s, %s, %s, %s)", (user_id, *t))

        # 2. Sample Assignments
        sample_assignments = [
            ('CPU Scheduling Algorithms Lab Report', 'Operating Systems', 'Document Round Robin and FCFS simulation outputs with Gantt charts.', str(today + timedelta(days=3)), 'Pending'),
            ('SQL Schema Design & ER Diagram for Library Management', 'DBMS', 'Design relational schema with DDL queries, primary keys, and foreign keys.', str(today + timedelta(days=7)), 'Pending'),
            ('Socket Programming TCP/IP Client-Server in C', 'Computer Networks', 'Implement multi-client chat server using POSIX sockets.', str(today + timedelta(days=12)), 'Pending'),
            ('Software Requirement Specification (SRS) Document', 'Software Engineering', 'IEEE format specification for student management app.', str(today - timedelta(days=2)), 'Completed')
        ]
        for a in sample_assignments:
            execute_db("INSERT INTO assignments (user_id, title, subject, description, submission_date, status) VALUES (%s, %s, %s, %s, %s, %s)", (user_id, *a))

        # 3. Sample Notes
        sample_notes = [
            ('Database Indexing & B+ Trees', 'DBMS', 'Key Concepts:\n- Clustered Index: Determines physical order of data rows in a table.\n- Non-Clustered Index: Contains pointers to data rows.\n- B+ Trees: High fanout, all data stored in leaf nodes linked sequentially for fast range scans.', 1),
            ('Process Synchronization & Semaphores', 'Operating Systems', 'Mutual Exclusion Conditions:\n1. No two processes inside Critical Section simultaneously.\n2. No assumptions about CPU speeds.\n3. No process outside CS should block other processes.\n4. No process waits indefinitely (Starvation freedom).\n\nBinary vs Counting Semaphores.', 1),
            ('TCP 3-Way Handshake & Congestion Control', 'Computer Networks', 'Connection Setup:\n1. SYN (seq = x)\n2. SYN-ACK (seq = y, ack = x+1)\n3. ACK (seq = x+1, ack = y+1)\n\nCongestion Window: Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery.', 0),
            ('Asymptotic Notations & Master Theorem', 'Design & Analysis of Algorithms', 'T(n) = aT(n/b) + f(n)\n- Case 1: f(n) = O(n^(log_b(a) - e)) -> Theta(n^log_b(a))\n- Case 2: f(n) = Theta(n^log_b(a) * log^k(n))\n- Case 3: f(n) = Omega(n^(log_b(a) + e))', 1)
        ]
        for n in sample_notes:
            execute_db("INSERT INTO notes (user_id, title, subject, content, is_important) VALUES (%s, %s, %s, %s, %s)", (user_id, *n))

        # 4. Sample Timetable
        sample_timetable = [
            ('Monday', 'Database Systems', '09:00', '10:30', 'Room 302'),
            ('Monday', 'Operating Systems Lab', '11:00', '13:00', 'Lab 2'),
            ('Tuesday', 'Computer Networks', '10:00', '11:30', 'Room 205'),
            ('Tuesday', 'Data Structures & Algorithms', '12:00', '13:30', 'Room 302'),
            ('Wednesday', 'Operating Systems', '09:30', '11:00', 'Room 302'),
            ('Wednesday', 'Web Technologies', '11:30', '13:00', 'Lab 4'),
            ('Thursday', 'Computer Networks Lab', '09:00', '11:00', 'Lab 1'),
            ('Thursday', 'Database Systems', '11:30', '13:00', 'Room 302'),
            ('Friday', 'Software Engineering', '10:00', '11:30', 'Room 205'),
            ('Friday', 'Algorithms Seminar', '12:00', '13:30', 'Seminar Hall B')
        ]
        for tt in sample_timetable:
            execute_db("INSERT INTO timetable (user_id, day, subject, start_time, end_time, room) VALUES (%s, %s, %s, %s, %s, %s)", (user_id, *tt))

        # 5. Sample Exams
        sample_exams = [
            ('Mid-Term Exam - DBMS', 'Database Systems', str(today + timedelta(days=6)), '10:00', 'Exam Hall A'),
            ('Practical Exam - OS Lab', 'Operating Systems', str(today + timedelta(days=14)), '14:00', 'Computer Lab 2'),
            ('Semester Final - Computer Networks', 'Computer Networks', str(today + timedelta(days=24)), '10:00', 'Main Auditorium'),
            ('Semester Final - Data Structures', 'Algorithms', str(today + timedelta(days=28)), '14:00', 'Exam Hall B')
        ]
        for ex in sample_exams:
            execute_db("INSERT INTO exams (user_id, exam_name, subject, exam_date, exam_time, venue) VALUES (%s, %s, %s, %s, %s, %s)", (user_id, *ex))

        # 6. Sample Expenses
        sample_expenses = [
            ('College', 1850.00, str(today - timedelta(days=1)), 'Textbooks & Lab Manuals'),
            ('Food', 180.00, str(today), 'Campus Canteen Lunch'),
            ('Travel', 350.00, str(today - timedelta(days=3)), 'Monthly Metro Card Recharge'),
            ('Food', 220.00, str(today - timedelta(days=4)), 'Coffee & Snacks with study group'),
            ('Shopping', 650.00, str(today - timedelta(days=6)), 'Stationery, Notebooks & Scientific Calculator'),
            ('Other', 200.00, str(today - timedelta(days=8)), 'Photocopies and project printing')
        ]
        for exp in sample_expenses:
            execute_db("INSERT INTO expenses (user_id, category, amount, expense_date, description) VALUES (%s, %s, %s, %s, %s)", (user_id, *exp))

        print("[INIT] Seeded realistic student demo data successfully!")
    except Exception as e:
        print(f"[WARN] Failed to seed demo data: {e}")
