/**
 * NEXORA - Authentication & Profile JavaScript
 * Handles login, registration, and profile updates.
 */

document.addEventListener('DOMContentLoaded', () => {
  initRegisterForm();
  initLoginForm();
  initProfilePage();
});

/* --- Registration Form Handler --- */
function initRegisterForm() {
  const registerForm = document.getElementById('registerForm');
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const course = document.getElementById('regCourse').value.trim();
    const semester = document.getElementById('regSemester').value.trim();
    const submitBtn = registerForm.querySelector('button[type="submit"]');

    if (!name || !email || !password) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    const res = await fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, course, semester })
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Student Account';

    if (res && res.success) {
      showToast(res.message, 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 700);
    } else if (res) {
      showToast(res.message || 'Registration failed.', 'error');
    }
  });
}

/* --- Login Form Handler --- */
function initLoginForm() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (!email || !password) {
      showToast('Please enter your email and password.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    const res = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';

    if (res && res.success) {
      showToast(res.message, 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } else if (res) {
      showToast(res.message || 'Invalid credentials.', 'error');
    }
  });
}

/* --- Profile Page Handler --- */
async function initProfilePage() {
  const profileForm = document.getElementById('profileForm');
  if (!profileForm) return;

  // Load current profile data
  const res = await fetchAPI('/api/auth/me');
  if (res && res.success && res.user) {
    const u = res.user;
    document.getElementById('profileName').value = u.name || '';
    document.getElementById('profileEmail').value = u.email || '';
    document.getElementById('profileCourse').value = u.course || '';
    document.getElementById('profileSemester').value = u.semester || '';

    // Update avatar and labels
    const avatarBadge = document.getElementById('profileAvatarBadge');
    if (avatarBadge) avatarBadge.textContent = (u.name || 'S')[0].toUpperCase();

    const nameLabel = document.getElementById('profileDisplayName');
    if (nameLabel) nameLabel.textContent = u.name;

    const emailLabel = document.getElementById('profileDisplayEmail');
    if (emailLabel) emailLabel.textContent = u.email;

    const joinedLabel = document.getElementById('profileJoinedDate');
    if (joinedLabel && u.created_at) joinedLabel.textContent = u.created_at;
  }

  // Profile update form submission
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profileName').value.trim();
    const course = document.getElementById('profileCourse').value.trim();
    const semester = document.getElementById('profileSemester').value.trim();
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const submitBtn = profileForm.querySelector('button[type="submit"]');

    if (!name) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    if (newPassword && !currentPassword) {
      showToast('Please enter your current password to set a new password.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Changes...';

    const res = await fetchAPI('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name,
        course,
        semester,
        current_password: currentPassword,
        new_password: newPassword
      })
    });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Changes';

    if (res && res.success) {
      showToast(res.message, 'success');
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      // Update displayed name
      const nameLabel = document.getElementById('profileDisplayName');
      if (nameLabel) nameLabel.textContent = name;
    } else if (res) {
      showToast(res.message || 'Failed to update profile.', 'error');
    }
  });
}
