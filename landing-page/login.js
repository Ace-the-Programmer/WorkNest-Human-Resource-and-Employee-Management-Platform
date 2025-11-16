const form = document.querySelector('form');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const identifier = form.identifier.value;
    const password = form.password.value;

    const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();
    if (res.ok) {
        // Save user info for session
        localStorage.setItem('user', JSON.stringify(data));
        // Redirect based on role
        if (data.role === 'HR/Admin') {
            window.location.href = '../admin-side/admin-dashboard.html';
        } else {
            window.location.href = '../employee-side/employee-dashboard.html';
        }
    } else {
        alert(data.error || 'Login failed');
    }
});
