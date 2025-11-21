const form = document.getElementById('signupForm');
const accountTypeButtons = document.querySelectorAll('.account-type-btn');
const departmentField = document.getElementById('departmentField');
let selectedAccountType = 'HR/Admin'; // default

// Handle account type selection
accountTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        accountTypeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAccountType = btn.dataset.type;
        if (selectedAccountType.toLowerCase() === 'employee') {
            departmentField.style.display = 'block';
            form.department.setAttribute('required', 'required');
        } else {
            departmentField.style.display = 'none';
            form.department.removeAttribute('required');
        }
    });
});

// Handle form submission - send DEPARTMENT NAME (not id)
form.addEventListener('submit', (e) => {
    e.preventDefault();
const departmentName =
    selectedAccountType.toLowerCase() === 'employee'
        ? form.department.options[form.department.selectedIndex].text
        : null;
const departmentId =
    selectedAccountType.toLowerCase() === 'employee'
        ? form.department.value
        : null;

const formData = {
    first_name: form.first_name.value,
    last_name: form.last_name.value,
    email: form.email.value,
    password: form.password.value,
    account_type: selectedAccountType,
    department_id: departmentId,        // number (1, 2, ...)
    department_name: departmentName     // name ("Information Technology")
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

// Trigger default logic for button highlighting
document.querySelector('.account-type-btn.active').click();
