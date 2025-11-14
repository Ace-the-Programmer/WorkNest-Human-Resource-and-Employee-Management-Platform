// Check if user just logged out
window.addEventListener('load', function() {
    const isLoggedOut = sessionStorage.getItem('isLoggedOut');
    
    if (isLoggedOut === 'true') {
        // Show logout success toast
        showToast('Logged Out', 'You have been successfully logged out');
        
        // Clear the flag
        sessionStorage.removeItem('isLoggedOut');
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