// Send logged-in users straight to the dashboard.
if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
}

function switchTab(tab) {
    const loginForm    = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLogin     = document.getElementById('tab-login');
    const tabRegister  = document.getElementById('tab-register');
    const footer       = document.getElementById('authFooter');

    clearAlert();

    if (tab === 'login') {
        loginForm.style.display    = 'flex';
        registerForm.style.display = 'none';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        footer.innerHTML = `Don't have an account? <span onclick="switchTab('register')">Register</span>`;
    } else {
        loginForm.style.display    = 'none';
        registerForm.style.display = 'flex';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        footer.innerHTML = `Already have an account? <span onclick="switchTab('login')">Login</span>`;
    }
}

function showAlert(message, type = 'error') {
    const el = document.getElementById('authAlert');
    el.className = `alert alert-${type} show`;

    const icon = type === 'error'
        ? `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`
        : `<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`;

    el.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"
             style="flex-shrink:0;margin-top:1px">${icon}</svg>
        <span>${message}</span>`;
}

function clearAlert() {
    const el = document.getElementById('authAlert');
    el.className = 'alert';
    el.innerHTML = '';
}

function setLoading(btnId, loading, label) {
    const btn = document.getElementById(btnId);
    btn.disabled = loading;
    btn.innerHTML = loading ? `<span class="spinner"></span>` : label;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!validateEmail(email)) return showAlert('Please enter a valid email address.');
    if (!password)             return showAlert('Password is required.');

    setLoading('loginBtn', true, 'Login');

    try {
        const data = await AuthAPI.login({ email, password });
        Auth.setToken(data.token);
        Auth.setUser(data.user);
        showAlert('Login successful! Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 900);
    } catch (err) {
        showAlert(err.message || 'Login failed. Please try again.');
        setLoading('loginBtn', false, 'Login');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const userName = document.getElementById('regName').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;

    if (userName.length < 3)    return showAlert('Username must be at least 3 characters.');
    if (!validateEmail(email))  return showAlert('Please enter a valid email address.');
    if (password.length < 6)    return showAlert('Password must be at least 6 characters.');

    setLoading('registerBtn', true, 'Create Account');

    try {
        await AuthAPI.register({ userName, email, password });
        showAlert('Account created! Please login.', 'success');
        document.getElementById('registerForm').reset();
        setTimeout(() => switchTab('login'), 1400);
    } catch (err) {
        showAlert(err.message || 'Registration failed. Please try again.');
        setLoading('registerBtn', false, 'Create Account');
    }
});
