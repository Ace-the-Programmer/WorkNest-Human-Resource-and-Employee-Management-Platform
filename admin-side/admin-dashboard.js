// Check if user just logged in
window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        // Show login success toast
        showToast('Login Successful', 'Welcome to HR Dashboard');
        
        // Clear the flag so toast doesn't show on refresh
        sessionStorage.removeItem('isLoggedIn');
    }
});

// Show Toast Notification
function showToast(title, message) {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Handle Logout
function handleLogout() {
    // Set logout flag
    sessionStorage.setItem('isLoggedOut', 'true');
    
    // Redirect to landing page
    window.location.href = '../landing-page/index.html';
}