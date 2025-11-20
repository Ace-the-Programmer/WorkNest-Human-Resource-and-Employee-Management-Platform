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

    fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: employeeId, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.role && data.role.toLowerCase() === 'employee') {
            // Save user data as needed
            localStorage.setItem('user', JSON.stringify(data));
            window.location.href = 'employee-dashboard.html';
        } else if (data && data.error) {
            alert(data.error);
        } else {
            alert('Access denied. This portal is for Employees only.');
        }
    })
    .catch(error => {
        console.error(error);
        alert('Login failed. Please try again.');
    });
}
