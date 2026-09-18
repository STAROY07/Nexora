"""
NEXORA Authentication Routes
Handles student registration, login, logout, and profile management.
Uses Werkzeug password hashing and Flask session management.
"""

import re
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash
from backend.database import query_db, execute_db

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def is_valid_email(email):
    """Simple regex to validate email format."""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return re.match(pattern, email) is not None


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new student account.
    Required: name, email, password
    Optional: course, semester
    """
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    course = data.get('course', '').strip()
    semester = data.get('semester', '').strip()

    # Form Validations
    if not name:
        return jsonify({'success': False, 'message': 'Full name is required.'}), 400
    if not email or not is_valid_email(email):
        return jsonify({'success': False, 'message': 'A valid email address is required.'}), 400
    if not password or len(password) < 6:
        return jsonify({'success': False, 'message': 'Password must be at least 6 characters long.'}), 400

    # Check for duplicate email
    existing_user = query_db("SELECT id FROM users WHERE email = %s", (email,), one=True)
    if existing_user:
        return jsonify({'success': False, 'message': 'An account with this email already exists. Please login.'}), 409

    try:
        # Securely hash the password
        hashed_password = generate_password_hash(password)

        # Insert student record
        user_id = execute_db(
            """
            INSERT INTO users (name, email, password, course, semester)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (name, email, hashed_password, course or None, semester or None)
        )

        # Auto-login: store user in session
        session['user_id'] = user_id
        session['name'] = name
        session['email'] = email

        return jsonify({
            'success': True,
            'message': 'Registration successful! Welcome to NEXORA.',
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'course': course,
                'semester': semester
            }
        }), 201

    except Exception as e:
        print(f"Registration Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to create account. Please try again later.'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate an existing student.
    Required: email, password
    """
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'success': False, 'message': 'Please provide both email and password.'}), 400

    user = query_db(
        "SELECT id, name, email, password, course, semester FROM users WHERE email = %s",
        (email,),
        one=True
    )

    if not user:
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

    # Verify password hash
    if not check_password_hash(user['password'], password):
        return jsonify({'success': False, 'message': 'Invalid email or password.'}), 401

    # Store user in session
    session['user_id'] = user['id']
    session['name'] = user['name']
    session['email'] = user['email']

    return jsonify({
        'success': True,
        'message': f"Welcome back, {user['name']}!",
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'course': user['course'],
            'semester': user['semester']
        }
    })


@auth_bp.route('/demo-login', methods=['POST', 'GET'])
def demo_login():
    """1-Click login as the pre-seeded demo student."""
    demo_email = 'demo@nexora.com'
    user = query_db(
        "SELECT id, name, email, course, semester FROM users WHERE email = %s",
        (demo_email,),
        one=True
    )
    if not user:
        from backend.database import seed_demo_data
        seed_demo_data()
        user = query_db(
            "SELECT id, name, email, course, semester FROM users WHERE email = %s",
            (demo_email,),
            one=True
        )

    session['user_id'] = user['id']
    session['name'] = user['name']
    session['email'] = user['email']

    if request.method == 'GET':
        from flask import redirect
        return redirect('/dashboard')

    return jsonify({
        'success': True,
        'message': f"Logged in as Demo Student ({user['name']})",
        'user': user
    })


@auth_bp.route('/logout', methods=['POST', 'GET'])
def logout():
    """Clear student session and logout."""
    session.clear()
    return jsonify({'success': True, 'message': 'Successfully logged out.'})


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Returns the authenticated student's profile details."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    user = query_db(
        "SELECT id, name, email, course, semester, created_at FROM users WHERE id = %s",
        (user_id,),
        one=True
    )

    if not user:
        session.clear()
        return jsonify({'success': False, 'message': 'User account not found.'}), 404

    # Format created_at for frontend
    if user.get('created_at'):
        user['created_at'] = user['created_at'].strftime('%Y-%m-%d %H:%M')

    return jsonify({'success': True, 'user': user})


@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """Updates student profile information or password."""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    course = data.get('course', '').strip()
    semester = data.get('semester', '').strip()
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    if not name:
        return jsonify({'success': False, 'message': 'Full name cannot be empty.'}), 400

    # If updating password
    if new_password:
        if len(new_password) < 6:
            return jsonify({'success': False, 'message': 'New password must be at least 6 characters long.'}), 400
        
        # Verify current password
        user = query_db("SELECT password FROM users WHERE id = %s", (user_id,), one=True)
        if not user or not check_password_hash(user['password'], current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect.'}), 400

        hashed_password = generate_password_hash(new_password)
        execute_db(
            "UPDATE users SET name = %s, course = %s, semester = %s, password = %s WHERE id = %s",
            (name, course or None, semester or None, hashed_password, user_id)
        )
    else:
        execute_db(
            "UPDATE users SET name = %s, course = %s, semester = %s WHERE id = %s",
            (name, course or None, semester or None, user_id)
        )

    session['name'] = name

    return jsonify({
        'success': True,
        'message': 'Profile updated successfully!',
        'user': {
            'id': user_id,
            'name': name,
            'email': session.get('email'),
            'course': course,
            'semester': semester
        }
    })
