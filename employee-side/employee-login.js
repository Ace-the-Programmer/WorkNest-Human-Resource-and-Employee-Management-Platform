// Toggle Password Visibility
function togglePassword() {
const passwordInput = document.getElementById('password');
const eyeIcon = document.getElementById('eyeIcon');
if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
    `;
} else {
    passwordInput.type = 'password';
    eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
    `;
}
}

// Handle Login Form Submit
function handleLogin(event) {
event.preventDefault();
const employeeId = document.getElementById('employeeId').value;
const password = document.getElementById('password').value;
const remember = document.getElementById('remember').checked;

// Store login info for dashboard
sessionStorage.setItem('isLoggedIn', 'true');
sessionStorage.setItem('employeeId', employeeId);
sessionStorage.setItem('userType', 'employee');

// Redirect to employee dashboard
window.location.href = '../employee-side/employee-dashboard.html';
}
