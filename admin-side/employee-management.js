let editEmployeeId = null;

function loadEmployees() {
  fetch('http://localhost:3000/employees')
    .then(response => response.json())
    .then(data => {
      const tbody = document.querySelector('.employee-table tbody');
      tbody.innerHTML = '';
      data.forEach(emp => {
        // ✅ Define initials FIRST
        const initials = (emp.first_name && emp.last_name)
          ? emp.first_name[0].toUpperCase() + emp.last_name[0].toUpperCase()
          : 'NA';
        
        // ✅ Define status based on DB value
        const status = emp.status === 'Inactive'
          ? '<span class="status-badge inactive">Inactive</span>'
          : '<span class="status-badge active">Active</span>';
        
        tbody.innerHTML += `
          <tr>
            <td>
              <div class="employee-info">
                <div class="avatar" style="background: #90CAF9;">${initials}</div>
                <div>
                  <div class="employee-name">${emp.first_name || ''} ${emp.last_name || ''}</div>
                  <div class="employee-email">${emp.email || ''}</div>
                </div>
              </div>
            </td>
            <td>${emp.id || ''}</td>
            <td>${emp.department_id || ''}</td>
            <td>${emp.position || ''}</td>
            <td>${status}</td>
            <td>
              <div class="action-buttons">
                <button class="action-icon view" title="View">👁️</button>
                <button class="action-icon edit" title="Edit">✏️</button>
                <button class="action-icon delete" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      });
      addActionListeners();
    })
    .catch(err => console.error('Error loading employees:', err));
}

function addActionListeners() {
  // DELETE
  document.querySelectorAll('.action-icon.delete').forEach(btn => {
    btn.onclick = function () {
      const row = btn.closest('tr');
      const empId = row.cells[1].textContent;
      if (confirm(`Delete employee ID ${empId}?`)) {
        fetch('http://localhost:3000/employees/' + empId, { method: "DELETE" })
          .then(r => {
            if (!r.ok) throw new Error();
            row.remove();
          })
          .catch(() => alert("Failed to delete."));
      }
    };
  });

  // EDIT
  document.querySelectorAll('.action-icon.edit').forEach(btn => {
    btn.onclick = function () {
      const row = btn.closest('tr');
      editEmployeeId = row.cells[1].textContent;
      document.getElementById('modalTitle').innerText = 'Edit Employee';
      document.getElementById('submitBtn').innerText = 'Save Changes';
      const name = row.querySelector('.employee-name').textContent.split(' ');
      form.first_name.value = name[0];
      form.last_name.value = name.slice(1).join(' ');
      form.email.value = row.querySelector('.employee-email').textContent || '';
      form.department_id.value = row.cells[2].textContent;
      form.position.value = row.cells[3].textContent;
      form.date_hired.value = '';
      form.salary.value = '';
      form.password.value = '';
      form.status.value = (row.cells[4].textContent.trim() === 'Inactive') ? 'Inactive' : 'Active';
      modal.style.display = 'flex';
    };
  });

  // VIEW
  document.querySelectorAll('.action-icon.view').forEach(btn => {
    btn.onclick = function () {
      const row = btn.closest('tr');
      const empName = row.querySelector('.employee-name').textContent;
      const empEmail = row.querySelector('.employee-email').textContent;
      const empDept = row.cells[2].textContent;
      const empPos  = row.cells[3].textContent;
      const empStatus = row.cells[4].textContent;
      alert(`Employee: ${empName}\nEmail: ${empEmail}\nDepartment: ${empDept}\nPosition: ${empPos}\nStatus: ${empStatus}`);
    };
  });
}

const addBtn = document.querySelector('.add-btn');
const modal = document.getElementById('addEmployeeModal');
const closeModal = document.getElementById('closeModal');
const form = document.getElementById('addEmployeeForm');

addBtn.onclick = () => {
  editEmployeeId = null;
  document.getElementById('modalTitle').innerText = 'Add New Employee';
  document.getElementById('submitBtn').innerText = 'Add Employee';
  form.reset();
  modal.style.display = 'flex';
};

closeModal.onclick = () => { modal.style.display = 'none'; };
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };

form.onsubmit = function(event) {
  event.preventDefault();

  const payload = {
    first_name: form.first_name.value,
    last_name: form.last_name.value,
    email: form.email ? form.email.value : '',
    department_id: form.department_id.value,  // ✅ Use department_id
    position: form.position.value,
    date_hired: form.date_hired ? form.date_hired.value : '',
    salary: form.salary ? parseFloat(form.salary.value) : '',
    password: form.password ? form.password.value : '',
    status: form.status.value  // ✅ Status from dropdown
  };

  let url = 'http://localhost:3000/employees';
  let method = 'POST';
  if (editEmployeeId) {
    url = `http://localhost:3000/employees/${editEmployeeId}`;
    method = 'PUT';
  }
  fetch(url, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => {
    if (!res.ok) throw new Error();
    modal.style.display = 'none';
    form.reset();
    loadEmployees();
  })
  .catch(() => alert('Failed to save employee.'));
};

document.addEventListener("DOMContentLoaded", loadEmployees);
