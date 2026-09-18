"""
NEXORA REST API Routes
Handles CRUD operations for Tasks, Assignments, Notes, Timetable, Exams, Expenses,
and aggregated metrics for Dashboard and Progress pages.
Every operation strictly filters by session['user_id'] to ensure complete data isolation.
"""

from datetime import datetime, date, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify, session
from backend.database import query_db, execute_db

api_bp = Blueprint('api', __name__, url_prefix='/api')


def login_required(f):
    """Decorator ensuring that only authenticated users can access the route."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'success': False, 'message': 'Authentication required. Please login.'}), 401
        return f(*args, **kwargs)
    return decorated_function


# ==========================================================
# 1. TASKS / TO-DO MODULE
# ==========================================================

@api_bp.route('/tasks', methods=['GET'])
@login_required
def get_tasks():
    user_id = session['user_id']
    status = request.args.get('status')
    priority = request.args.get('priority')

    query = "SELECT * FROM tasks WHERE user_id = %s"
    params = [user_id]

    if status and status != 'All':
        query += " AND status = %s"
        params.append(status)

    if priority and priority != 'All':
        query += " AND priority = %s"
        params.append(priority)

    query += " ORDER BY due_date ASC, id DESC"
    tasks = query_db(query, tuple(params))

    # Format dates as YYYY-MM-DD
    for t in tasks:
        if t.get('due_date'):
            t['due_date'] = t['due_date'].strftime('%Y-%m-%d')
        if t.get('created_at'):
            t['created_at'] = t['created_at'].strftime('%Y-%m-%d %H:%M')

    return jsonify({'success': True, 'tasks': tasks})


@api_bp.route('/tasks', methods=['POST'])
@login_required
def create_task():
    user_id = session['user_id']
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    priority = data.get('priority', 'Medium')
    due_date = data.get('due_date') or None

    if not title:
        return jsonify({'success': False, 'message': 'Task title cannot be empty.'}), 400

    if priority not in ['Low', 'Medium', 'High']:
        priority = 'Medium'

    task_id = execute_db(
        """
        INSERT INTO tasks (user_id, title, description, priority, due_date, status)
        VALUES (%s, %s, %s, %s, %s, 'Pending')
        """,
        (user_id, title, description or None, priority, due_date)
    )

    return jsonify({'success': True, 'message': 'Task created successfully!', 'task_id': task_id}), 201


@api_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    user_id = session['user_id']
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    priority = data.get('priority', 'Medium')
    due_date = data.get('due_date') or None
    status = data.get('status', 'Pending')

    if not title:
        return jsonify({'success': False, 'message': 'Task title cannot be empty.'}), 400

    execute_db(
        """
        UPDATE tasks 
        SET title = %s, description = %s, priority = %s, due_date = %s, status = %s
        WHERE id = %s AND user_id = %s
        """,
        (title, description or None, priority, due_date, status, task_id, user_id)
    )

    return jsonify({'success': True, 'message': 'Task updated successfully!'})


@api_bp.route('/tasks/<int:task_id>/toggle', methods=['PATCH'])
@login_required
def toggle_task(task_id):
    user_id = session['user_id']
    task = query_db("SELECT status FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id), one=True)
    if not task:
        return jsonify({'success': False, 'message': 'Task not found.'}), 404

    new_status = 'Completed' if task['status'] == 'Pending' else 'Pending'
    execute_db("UPDATE tasks SET status = %s WHERE id = %s AND user_id = %s", (new_status, task_id, user_id))

    return jsonify({'success': True, 'message': f'Task marked as {new_status}!', 'status': new_status})


@api_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    user_id = session['user_id']
    execute_db("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
    return jsonify({'success': True, 'message': 'Task deleted successfully!'})


# ==========================================================
# 2. ASSIGNMENT TRACKER MODULE
# ==========================================================

@api_bp.route('/assignments', methods=['GET'])
@login_required
def get_assignments():
    user_id = session['user_id']
    status = request.args.get('status')

    query = "SELECT * FROM assignments WHERE user_id = %s"
    params = [user_id]

    if status and status != 'All':
        query += " AND status = %s"
        params.append(status)

    query += " ORDER BY submission_date ASC, id DESC"
    assignments = query_db(query, tuple(params))

    today = date.today()
    for a in assignments:
        if a.get('submission_date'):
            sub_date = a['submission_date']
            days_left = (sub_date - today).days
            a['submission_date'] = sub_date.strftime('%Y-%m-%d')
            a['days_left'] = days_left
        if a.get('created_at'):
            a['created_at'] = a['created_at'].strftime('%Y-%m-%d %H:%M')

    return jsonify({'success': True, 'assignments': assignments})


@api_bp.route('/assignments', methods=['POST'])
@login_required
def create_assignment():
    user_id = session['user_id']
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    subject = data.get('subject', '').strip()
    description = data.get('description', '').strip()
    submission_date = data.get('submission_date')

    if not title or not subject or not submission_date:
        return jsonify({'success': False, 'message': 'Title, subject, and submission date are required.'}), 400

    assignment_id = execute_db(
        """
        INSERT INTO assignments (user_id, title, subject, description, submission_date, status)
        VALUES (%s, %s, %s, %s, %s, 'Pending')
        """,
        (user_id, title, subject, description or None, submission_date)
    )

    return jsonify({'success': True, 'message': 'Assignment added successfully!', 'assignment_id': assignment_id}), 201


@api_bp.route('/assignments/<int:assignment_id>', methods=['PUT'])
@login_required
def update_assignment(assignment_id):
    user_id = session['user_id']
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    subject = data.get('subject', '').strip()
    description = data.get('description', '').strip()
    submission_date = data.get('submission_date')
    status = data.get('status', 'Pending')

    if not title or not subject or not submission_date:
        return jsonify({'success': False, 'message': 'Title, subject, and submission date are required.'}), 400

    execute_db(
        """
        UPDATE assignments
        SET title = %s, subject = %s, description = %s, submission_date = %s, status = %s
        WHERE id = %s AND user_id = %s
        """,
        (title, subject, description or None, submission_date, status, assignment_id, user_id)
    )

    return jsonify({'success': True, 'message': 'Assignment updated successfully!'})


@api_bp.route('/assignments/<int:assignment_id>/toggle', methods=['PATCH'])
@login_required
def toggle_assignment(assignment_id):
    user_id = session['user_id']
    assignment = query_db("SELECT status FROM assignments WHERE id = %s AND user_id = %s", (assignment_id, user_id), one=True)
    if not assignment:
        return jsonify({'success': False, 'message': 'Assignment not found.'}), 404

    new_status = 'Completed' if assignment['status'] == 'Pending' else 'Pending'
    execute_db("UPDATE assignments SET status = %s WHERE id = %s AND user_id = %s", (new_status, assignment_id, user_id))

    return jsonify({'success': True, 'message': f'Assignment marked as {new_status}!', 'status': new_status})


@api_bp.route('/assignments/<int:assignment_id>', methods=['DELETE'])
@login_required
def delete_assignment(assignment_id):
    user_id = session['user_id']
    execute_db("DELETE FROM assignments WHERE id = %s AND user_id = %s", (assignment_id, user_id))
    return jsonify({'success': True, 'message': 'Assignment deleted successfully!'})


# ==========================================================
# 3. NOTES MANAGER MODULE
# ==========================================================

@api_bp.route('/notes', methods=['GET'])
@login_required
def get_notes():
    user_id = session['user_id']
    search = request.args.get('search', '').strip()
    subject = request.args.get('subject', '').strip()
    important_only = request.args.get('important') == 'true'

    query = "SELECT * FROM notes WHERE user_id = %s"
    params = [user_id]

    if subject and subject != 'All':
        query += " AND subject = %s"
        params.append(subject)

    if important_only:
        query += " AND is_important = 1"

    if search:
        query += " AND (title LIKE %s OR content LIKE %s OR subject LIKE %s)"
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern])

    query += " ORDER BY is_important DESC, updated_at DESC"
    notes = query_db(query, tuple(params))

    for n in notes:
        if n.get('created_at'):
            n['created_at'] = n['created_at'].strftime('%Y-%m-%d %H:%M')
        if n.get('updated_at'):
            n['updated_at'] = n['updated_at'].strftime('%Y-%m-%d %H:%M')

    # Get distinct list of subjects for filtering
    subjects = query_db("SELECT DISTINCT subject FROM notes WHERE user_id = %s ORDER BY subject ASC", (user_id,))
    subject_list = [s['subject'] for s in subjects if s.get('subject')]

    return jsonify({'success': True, 'notes': notes, 'subjects': subject_list})


@api_bp.route('/notes', methods=['POST'])
@login_required
def create_note():
    user_id = session['user_id']
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    subject = data.get('subject', '').strip()
    content = data.get('content', '').strip()
    is_important = 1 if data.get('is_important') else 0

    if not title or not content:
        return jsonify({'success': False, 'message': 'Title and content are required.'}), 400

    note_id = execute_db(
        """
        INSERT INTO notes (user_id, title, subject, content, is_important)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user_id, title, subject or 'General', content, is_important)
    )

    return jsonify({'success': True, 'message': 'Note created successfully!', 'note_id': note_id}), 201


@api_bp.route('/notes/<int:note_id>', methods=['PUT'])
@login_required
def update_note(note_id):
    user_id = session['user_id']
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    subject = data.get('subject', '').strip()
    content = data.get('content', '').strip()
    is_important = 1 if data.get('is_important') else 0

    if not title or not content:
        return jsonify({'success': False, 'message': 'Title and content are required.'}), 400

    execute_db(
        """
        UPDATE notes 
        SET title = %s, subject = %s, content = %s, is_important = %s
        WHERE id = %s AND user_id = %s
        """,
        (title, subject or 'General', content, is_important, note_id, user_id)
    )

    return jsonify({'success': True, 'message': 'Note updated successfully!'})


@api_bp.route('/notes/<int:note_id>/favorite', methods=['PATCH'])
@login_required
def toggle_note_favorite(note_id):
    user_id = session['user_id']
    note = query_db("SELECT is_important FROM notes WHERE id = %s AND user_id = %s", (note_id, user_id), one=True)
    if not note:
        return jsonify({'success': False, 'message': 'Note not found.'}), 404

    new_val = 0 if note['is_important'] else 1
    execute_db("UPDATE notes SET is_important = %s WHERE id = %s AND user_id = %s", (new_val, note_id, user_id))

    return jsonify({'success': True, 'is_important': bool(new_val)})


@api_bp.route('/notes/<int:note_id>', methods=['DELETE'])
@login_required
def delete_note(note_id):
    user_id = session['user_id']
    execute_db("DELETE FROM notes WHERE id = %s AND user_id = %s", (note_id, user_id))
    return jsonify({'success': True, 'message': 'Note deleted successfully!'})


# ==========================================================
# 4. TIMETABLE MODULE
# ==========================================================

@api_bp.route('/timetable', methods=['GET'])
@login_required
def get_timetable():
    user_id = session['user_id']
    schedule = query_db(
        """
        SELECT * FROM timetable 
        WHERE user_id = %s 
        ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), start_time ASC
        """,
        (user_id,)
    )

    for item in schedule:
        # Convert timedelta / time to string format HH:MM
        if item.get('start_time') is not None:
            total_seconds = int(item['start_time'].total_seconds()) if hasattr(item['start_time'], 'total_seconds') else 0
            hours, remainder = divmod(total_seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            time_str = f"{hours:02d}:{minutes:02d}"
            item['start_time_str'] = time_str
            item['start_time'] = time_str
        if item.get('end_time') is not None:
            total_seconds = int(item['end_time'].total_seconds()) if hasattr(item['end_time'], 'total_seconds') else 0
            hours, remainder = divmod(total_seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            time_str = f"{hours:02d}:{minutes:02d}"
            item['end_time_str'] = time_str
            item['end_time'] = time_str
        if item.get('created_at'):
            item['created_at'] = item['created_at'].strftime('%Y-%m-%d %H:%M')

    return jsonify({'success': True, 'timetable': schedule})


@api_bp.route('/timetable', methods=['POST'])
@login_required
def add_timetable_entry():
    user_id = session['user_id']
    data = request.get_json() or {}
    day = data.get('day', '').strip()
    subject = data.get('subject', '').strip()
    start_time = data.get('start_time', '').strip()
    end_time = data.get('end_time', '').strip()
    room = data.get('room', '').strip()

    valid_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    if day not in valid_days or not subject or not start_time or not end_time:
        return jsonify({'success': False, 'message': 'Please provide day, subject, start time, and end time.'}), 400

    entry_id = execute_db(
        """
        INSERT INTO timetable (user_id, day, subject, start_time, end_time, room)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (user_id, day, subject, start_time, end_time, room or None)
    )

    return jsonify({'success': True, 'message': 'Class added to timetable!', 'entry_id': entry_id}), 201


@api_bp.route('/timetable/<int:entry_id>', methods=['DELETE'])
@login_required
def delete_timetable_entry(entry_id):
    user_id = session['user_id']
    execute_db("DELETE FROM timetable WHERE id = %s AND user_id = %s", (entry_id, user_id))
    return jsonify({'success': True, 'message': 'Class removed from timetable!'})


# ==========================================================
# 5. EXAM PLANNER MODULE
# ==========================================================

@api_bp.route('/exams', methods=['GET'])
@login_required
def get_exams():
    user_id = session['user_id']
    exams = query_db(
        "SELECT * FROM exams WHERE user_id = %s ORDER BY exam_date ASC, exam_time ASC",
        (user_id,)
    )

    today = date.today()
    for ex in exams:
        if ex.get('exam_date'):
            ex_date = ex['exam_date']
            days_remaining = (ex_date - today).days
            ex['exam_date_str'] = ex_date.strftime('%Y-%m-%d')
            ex['exam_date'] = ex['exam_date_str']
            ex['days_remaining'] = days_remaining
            ex['is_past'] = days_remaining < 0
        if ex.get('exam_time') is not None:
            total_seconds = int(ex['exam_time'].total_seconds()) if hasattr(ex['exam_time'], 'total_seconds') else 0
            hours, remainder = divmod(total_seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            time_str = f"{hours:02d}:{minutes:02d}"
            ex['exam_time_str'] = time_str
            ex['exam_time'] = time_str
        if ex.get('created_at'):
            ex['created_at'] = ex['created_at'].strftime('%Y-%m-%d %H:%M')

    return jsonify({'success': True, 'exams': exams})


@api_bp.route('/exams', methods=['POST'])
@login_required
def add_exam():
    user_id = session['user_id']
    data = request.get_json() or {}
    exam_name = data.get('exam_name', '').strip()
    subject = data.get('subject', '').strip()
    exam_date = data.get('exam_date', '').strip()
    exam_time = data.get('exam_time', '').strip()
    venue = data.get('venue', '').strip()

    if not exam_name or not subject or not exam_date or not exam_time:
        return jsonify({'success': False, 'message': 'Exam name, subject, date, and time are required.'}), 400

    exam_id = execute_db(
        """
        INSERT INTO exams (user_id, exam_name, subject, exam_date, exam_time, venue)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (user_id, exam_name, subject, exam_date, exam_time, venue or None)
    )

    return jsonify({'success': True, 'message': 'Exam scheduled successfully!', 'exam_id': exam_id}), 201


@api_bp.route('/exams/<int:exam_id>', methods=['DELETE'])
@login_required
def delete_exam(exam_id):
    user_id = session['user_id']
    execute_db("DELETE FROM exams WHERE id = %s AND user_id = %s", (exam_id, user_id))
    return jsonify({'success': True, 'message': 'Exam deleted successfully!'})


# ==========================================================
# 6. EXPENSE TRACKER MODULE
# ==========================================================

@api_bp.route('/expenses', methods=['GET'])
@login_required
def get_expenses():
    user_id = session['user_id']
    month = request.args.get('month')  # e.g., '2026-09'

    query = "SELECT * FROM expenses WHERE user_id = %s"
    params = [user_id]

    if month:
        query += " AND DATE_FORMAT(expense_date, '%Y-%m') = %s"
        params.append(month)

    query += " ORDER BY expense_date DESC, id DESC"
    expenses = query_db(query, tuple(params))

    total_amount = 0.0
    for exp in expenses:
        amt = float(exp['amount'])
        total_amount += amt
        exp['amount'] = amt
        if exp.get('expense_date'):
            exp['expense_date_str'] = exp['expense_date'].strftime('%Y-%m-%d')

    # Category breakdown for the requested month or all
    summary_query = """
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM expenses
        WHERE user_id = %s
    """
    summary_params = [user_id]
    if month:
        summary_query += " AND DATE_FORMAT(expense_date, '%Y-%m') = %s"
        summary_params.append(month)
    summary_query += " GROUP BY category"

    category_summary = query_db(summary_query, tuple(summary_params))
    for cat in category_summary:
        cat['total'] = float(cat['total'])

    return jsonify({
        'success': True,
        'expenses': expenses,
        'total_amount': total_amount,
        'category_summary': category_summary
    })


@api_bp.route('/expenses', methods=['POST'])
@login_required
def add_expense():
    user_id = session['user_id']
    data = request.get_json() or {}
    category = data.get('category', 'Other')
    amount = data.get('amount')
    expense_date = data.get('expense_date') or str(date.today())
    description = data.get('description', '').strip()

    valid_categories = ['Food', 'Travel', 'College', 'Shopping', 'Other']
    if category not in valid_categories:
        category = 'Other'

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'Please enter a valid positive expense amount.'}), 400

    expense_id = execute_db(
        """
        INSERT INTO expenses (user_id, category, amount, expense_date, description)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user_id, category, amount, expense_date, description or None)
    )

    return jsonify({'success': True, 'message': 'Expense recorded successfully!', 'expense_id': expense_id}), 201


@api_bp.route('/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def update_expense(expense_id):
    user_id = session['user_id']
    data = request.get_json() or {}
    category = data.get('category', 'Other')
    amount = data.get('amount')
    expense_date = data.get('expense_date')
    description = data.get('description', '').strip()

    valid_categories = ['Food', 'Travel', 'College', 'Shopping', 'Other']
    if category not in valid_categories:
        category = 'Other'

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'Please enter a valid positive expense amount.'}), 400

    execute_db(
        """
        UPDATE expenses
        SET category = %s, amount = %s, expense_date = %s, description = %s
        WHERE id = %s AND user_id = %s
        """,
        (category, amount, expense_date, description or None, expense_id, user_id)
    )

    return jsonify({'success': True, 'message': 'Expense updated successfully!'})


@api_bp.route('/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    user_id = session['user_id']
    execute_db("DELETE FROM expenses WHERE id = %s AND user_id = %s", (expense_id, user_id))
    return jsonify({'success': True, 'message': 'Expense deleted successfully!'})


# ==========================================================
# 7. DASHBOARD AGGREGATED SUMMARY
# ==========================================================

@api_bp.route('/dashboard/summary', methods=['GET'])
@login_required
def get_dashboard_summary():
    user_id = session['user_id']
    today_str = str(date.today())
    current_month_str = datetime.today().strftime('%Y-%m')

    # Stat 1: Tasks
    tasks_active_row = query_db("SELECT COUNT(*) as cnt FROM tasks WHERE user_id = %s AND status = 'Pending'", (user_id,), one=True)
    tasks_total_row = query_db("SELECT COUNT(*) as cnt FROM tasks WHERE user_id = %s", (user_id,), one=True)
    active_tasks = tasks_active_row['cnt'] if tasks_active_row else 0
    total_tasks = tasks_total_row['cnt'] if tasks_total_row else 0
    completed_tasks = total_tasks - active_tasks
    task_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0

    # Stat 2: Assignments
    assignments_pending_row = query_db("SELECT COUNT(*) as cnt FROM assignments WHERE user_id = %s AND status = 'Pending'", (user_id,), one=True)
    pending_assignments = assignments_pending_row['cnt'] if assignments_pending_row else 0

    # Stat 3: Upcoming Exams
    exams_upcoming_row = query_db("SELECT COUNT(*) as cnt FROM exams WHERE user_id = %s AND exam_date >= %s", (user_id, today_str), one=True)
    upcoming_exams = exams_upcoming_row['cnt'] if exams_upcoming_row else 0

    # Stat 4: Total Notes
    notes_total_row = query_db("SELECT COUNT(*) as cnt FROM notes WHERE user_id = %s", (user_id,), one=True)
    total_notes = notes_total_row['cnt'] if notes_total_row else 0

    # Stat 5: Monthly Expenses
    expense_month_row = query_db(
        "SELECT SUM(amount) as total FROM expenses WHERE user_id = %s AND DATE_FORMAT(expense_date, '%%Y-%%m') = %s",
        (user_id, current_month_str),
        one=True
    )
    monthly_expenses = float(expense_month_row['total']) if (expense_month_row and expense_month_row['total']) else 0.0

    # Today's Tasks
    today_tasks = query_db(
        "SELECT * FROM tasks WHERE user_id = %s AND (due_date = %s OR (due_date IS NULL AND status = 'Pending')) ORDER BY status DESC, priority DESC LIMIT 5",
        (user_id, today_str)
    )
    for t in today_tasks:
        if t.get('due_date'):
            t['due_date'] = t['due_date'].strftime('%Y-%m-%d')

    # Upcoming Assignments
    upcoming_assignments_list = query_db(
        "SELECT * FROM assignments WHERE user_id = %s AND status = 'Pending' AND submission_date >= %s ORDER BY submission_date ASC LIMIT 5",
        (user_id, today_str)
    )
    for a in upcoming_assignments_list:
        sub_date = a['submission_date']
        a['days_left'] = (sub_date - date.today()).days
        a['submission_date'] = sub_date.strftime('%Y-%m-%d')

    # Upcoming Exams List
    upcoming_exams_list = query_db(
        "SELECT * FROM exams WHERE user_id = %s AND exam_date >= %s ORDER BY exam_date ASC LIMIT 4",
        (user_id, today_str)
    )
    for ex in upcoming_exams_list:
        ex_date = ex['exam_date']
        ex['days_remaining'] = (ex_date - date.today()).days
        ex['exam_date_str'] = ex_date.strftime('%Y-%m-%d')
        ex['exam_date'] = ex['exam_date_str']
        if ex.get('exam_time') is not None:
            total_seconds = int(ex['exam_time'].total_seconds()) if hasattr(ex['exam_time'], 'total_seconds') else 0
            hours, remainder = divmod(total_seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            time_str = f"{hours:02d}:{minutes:02d}"
            ex['exam_time_str'] = time_str
            ex['exam_time'] = time_str
        if ex.get('created_at'):
            ex['created_at'] = ex['created_at'].strftime('%Y-%m-%d %H:%M')

    # Recent Notes Preview
    recent_notes = query_db(
        "SELECT id, title, subject, is_important, updated_at FROM notes WHERE user_id = %s ORDER BY updated_at DESC LIMIT 4",
        (user_id,)
    )
    for n in recent_notes:
        if n.get('updated_at'):
            n['updated_at'] = n['updated_at'].strftime('%b %d, %Y')

    return jsonify({
        'success': True,
        'user_name': session.get('name', 'Student'),
        'stats': {
            'active_tasks': active_tasks,
            'completed_tasks': completed_tasks,
            'total_tasks': total_tasks,
            'task_completion_rate': task_rate,
            'pending_assignments': pending_assignments,
            'upcoming_exams': upcoming_exams,
            'total_notes': total_notes,
            'monthly_expenses': monthly_expenses
        },
        'today_tasks': today_tasks,
        'upcoming_assignments': upcoming_assignments_list,
        'upcoming_exams': upcoming_exams_list,
        'recent_notes': recent_notes
    })


# ==========================================================
# 8. PROGRESS & PRODUCTIVITY METRICS
# ==========================================================

@api_bp.route('/progress/summary', methods=['GET'])
@login_required
def get_progress_summary():
    user_id = session['user_id']
    current_month_str = datetime.today().strftime('%Y-%m')

    # Tasks Progress
    tasks_stats = query_db(
        """
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
        FROM tasks WHERE user_id = %s
        """,
        (user_id,),
        one=True
    )
    tasks_total = tasks_stats['total'] or 0
    tasks_completed = int(tasks_stats['completed'] or 0)
    tasks_pending = int(tasks_stats['pending'] or 0)
    task_percent = round((tasks_completed / tasks_total * 100), 1) if tasks_total > 0 else 0

    # Assignments Progress
    assign_stats = query_db(
        """
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
        FROM assignments WHERE user_id = %s
        """,
        (user_id,),
        one=True
    )
    assign_total = assign_stats['total'] or 0
    assign_completed = int(assign_stats['completed'] or 0)
    assign_pending = int(assign_stats['pending'] or 0)
    assign_percent = round((assign_completed / assign_total * 100), 1) if assign_total > 0 else 0

    # Subject-wise assignments breakdown
    subject_progress = query_db(
        """
        SELECT 
            subject,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
        FROM assignments 
        WHERE user_id = %s 
        GROUP BY subject
        ORDER BY total DESC
        """,
        (user_id,)
    )
    for sp in subject_progress:
        sp['completed'] = int(sp['completed'] or 0)
        sp['pending'] = int(sp['pending'] or 0)
        sp['rate'] = round((sp['completed'] / sp['total'] * 100), 1) if sp['total'] > 0 else 0

    # Monthly expense summary
    expense_stats = query_db(
        """
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE user_id = %s AND DATE_FORMAT(expense_date, '%%Y-%%m') = %s
        GROUP BY category
        """,
        (user_id, current_month_str)
    )
    total_month_expense = 0.0
    for es in expense_stats:
        es['total'] = float(es['total'])
        total_month_expense += es['total']

    # Upcoming exams count
    today_str = str(date.today())
    exams_count_row = query_db("SELECT COUNT(*) as cnt FROM exams WHERE user_id = %s AND exam_date >= %s", (user_id, today_str), one=True)
    upcoming_exams_count = exams_count_row['cnt'] if exams_count_row else 0

    return jsonify({
        'success': True,
        'tasks': {
            'total': tasks_total,
            'completed': tasks_completed,
            'pending': tasks_pending,
            'percentage': task_percent
        },
        'assignments': {
            'total': assign_total,
            'completed': assign_completed,
            'pending': assign_pending,
            'percentage': assign_percent,
            'by_subject': subject_progress
        },
        'upcoming_exams': upcoming_exams_count,
        'expenses': {
            'month': current_month_str,
            'total': total_month_expense,
            'categories': expense_stats
        }
    })
