const form = document.getElementById('signupForm');
const accountTypeButtons = document.querySelectorAll('.account-type-btn');
const departmentField = document.getElementById('departmentField');
let selectedAccountType = 'HR/Admin'; // default

// Handle account type selection
accountTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        accountTypeButtons.forEach(b => b.classList.remove('active'));
        
        // Add active to clicked
        btn.classList.add('active');
        selectedAccountType = btn.dataset.type;
        
        // Show/hide department field
        if (selectedAccountType === 'Employee') {
            departmentField.style.display = 'block';
            form.department.setAttribute('required', 'required');
        } else {
            departmentField.style.display = 'none';
            form.department.removeAttribute('required');
        }
    });
});

// Handle form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = {
        first_name: form.first_name.value,
        last_name: form.last_name.value,
        email: form.email.value,
        password: form.password.value,
        account_type: selectedAccountType,
        department_id: selectedAccountType === 'Employee' ? form.department.value : null
    };
    
    fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Account created successfully!');
            // Redirect based on role
            if (data.role === 'HR/Admin') {
                window.location.href = '../admin-side/admin-dashboard.html';
            } else {
                window.location.href = '../employee-side/employee-dashboard.html';
            }
        } else {
            alert('Failed to create account: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred during signup');
    });
});
