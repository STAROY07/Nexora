import os
import sys

# Ensure root directory is on sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from flask import Flask, send_from_directory, redirect, url_for, session, request
from backend.config import Config
from backend.database import init_db
from backend.routes.auth_routes import auth_bp
from backend.routes.api_routes import api_bp

# Set absolute path to the frontend directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
app.config.from_object(Config)

# Register API Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(api_bp)


# ==========================================================
# PAGE ROUTING & AUTH PROTECTION
# ==========================================================

def protected_page(page_filename):
    """Helper to serve protected HTML pages or redirect to login if unauthenticated."""
    if 'user_id' not in session:
        return redirect(url_for('login_page', next=request.path))
    return send_from_directory(FRONTEND_DIR, page_filename)


@app.route('/')
def landing_page():
    """Landing page - Public."""
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/login')
def login_page():
    """Student Login page."""
    if 'user_id' in session:
        return redirect(url_for('dashboard_page'))
    return send_from_directory(FRONTEND_DIR, 'login.html')


@app.route('/register')
def register_page():
    """Student Registration page."""
    if 'user_id' in session:
        return redirect(url_for('dashboard_page'))
    return send_from_directory(FRONTEND_DIR, 'register.html')


@app.route('/dashboard')
def dashboard_page():
    """Main Student Overview Dashboard."""
    return protected_page('dashboard.html')


@app.route('/tasks')
def tasks_page():
    """Daily Task Manager / To-Do."""
    return protected_page('tasks.html')


@app.route('/assignments')
def assignments_page():
    """Assignment Tracker."""
    return protected_page('assignments.html')


@app.route('/notes')
def notes_page():
    """Notes Manager."""
    return protected_page('notes.html')


@app.route('/timetable')
def timetable_page():
    """Weekly Class Timetable."""
    return protected_page('timetable.html')


@app.route('/exams')
def exams_page():
    """Exam Planner & Countdown."""
    return protected_page('exams.html')


@app.route('/expenses')
def expenses_page():
    """Student Personal Expense Tracker."""
    return protected_page('expenses.html')


@app.route('/progress')
def progress_page():
    """Productivity & Progress Overview."""
    return protected_page('progress.html')


@app.route('/profile')
def profile_page():
    """Student Profile & Settings."""
    return protected_page('profile.html')


# ==========================================================
# ERROR HANDLERS
# ==========================================================

@app.errorhandler(404)
def not_found(e):
    # If an API endpoint was requested, return JSON; else redirect or serve 404
    if request.path.startswith('/api/'):
        return {'success': False, 'message': 'API endpoint not found'}, 404
    return redirect(url_for('landing_page'))


# ==========================================================
# SERVER LAUNCH
# ==========================================================

if __name__ == '__main__':
    # Initialize database tables safely
    print("[INIT] Initializing NEXORA Database tables...")
    init_db()
    
    print(f"[START] Starting NEXORA server on http://localhost:{Config.PORT}...")
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
