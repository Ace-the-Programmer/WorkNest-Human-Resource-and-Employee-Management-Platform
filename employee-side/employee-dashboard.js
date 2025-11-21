// Check if user just logged in
window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        // Show login success notification
        showNotification('Login Successful', 'Welcome to Employee Dashboard');
        
        // Clear the flag so notification doesn't show on refresh
        sessionStorage.removeItem('isLoggedIn');
    }
});

// Show Notification
function showNotification(title, message) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    
    notification.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-subtitle">${message}</div>
        </div>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Handle Logout
function handleLogout() {
    // Set logout flag
    sessionStorage.setItem('isLoggedOut', 'true');
    localStorage.removeItem('user');
    
    // Redirect to landing page immediately
    window.location.href = '../landing-page/index.html';
}
