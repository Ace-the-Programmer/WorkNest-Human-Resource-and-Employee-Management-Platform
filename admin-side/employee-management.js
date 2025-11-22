let departments = [];
let allEmployees = [];
let currentPage = 1;
const itemsPerPage = 10;

// Fetch departments for filter dropdown
function loadDepartments(callback) {
    fetch('http://localhost:3000/departments')
        .then(r => r.json())
        .then(data => {
            departments = data;
            populateDepartmentFilter();
            if (callback) callback();
        });
}

// Fill department filter with all department names
function populateDepartmentFilter() {
    const filter = document.getElementById('deptFilter');
    filter.innerHTML = `<option value="">All Departments</option>` +
        departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
}

// Fetch all employees with status
function loadEmployees() {
    fetch('http://localhost:3000/users?role=employee')
        .then(response => response.json())
        .then(users => {
            allEmployees = users;
            renderEmployeeTable();
        })
        .catch(err => console.error('Error loading employees:', err));
}

// Render filtered and paginated employee table
function renderEmployeeTable() {
    const tbody = document.querySelector('.employee-table tbody');
    tbody.innerHTML = '';

    const searchVal = document.querySelector('.search-input').value.toLowerCase();
    const deptFilter = document.getElementById('deptFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = allEmployees.filter(emp => {
        const matchesSearch = (emp.username || '').toLowerCase().includes(searchVal);
        const matchesDept = !deptFilter || emp.department_name === deptFilter;
        const matchesStatus = !statusFilter || (emp.status && emp.status === statusFilter);
        return emp.role === "employee" && matchesSearch && matchesDept && matchesStatus;
    });

    // Pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (currentPage > totalPages) currentPage = 1;
    const start = (currentPage - 1) * itemsPerPage;
    const paginated = filtered.slice(start, start + itemsPerPage);

    // Table rows
    paginated.forEach(emp => {
        const initials = emp.username
            ? emp.username.substring(0, 2).toUpperCase()
            : 'NA';
        const statusBadge = emp.status === "Inactive"
            ? '<span class="status-badge inactive">Inactive</span>'
            : '<span class="status-badge active">Active</span>';
        tbody.innerHTML += `
          <tr>
            <td>
              <div class="employee-info">
                <div class="avatar" style="background: #90CAF9;">${initials}</div>
                <div>
                  <div class="employee-name">${emp.username || ''}</div>
                </div>
              </div>
            </td>
            <td>${emp.id || ''}</td>
            <td>${emp.department_name || ''}</td>
            <td>${statusBadge}</td>
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

    // Pagination info/controls
    document.querySelector('.pagination-info').innerText =
        `Showing ${totalItems ? start + 1 : 0}-${Math.min(start + itemsPerPage, totalItems)} of ${totalItems} employees`;
    document.querySelector('.page-btn.prev').disabled = currentPage === 1;
    document.querySelector('.page-btn.next').disabled = currentPage === totalPages || totalItems === 0;
}

// Handles action button clicks
function addActionListeners() {
    document.querySelectorAll('.action-icon.view').forEach(btn => {
        btn.onclick = function () {
            const row = btn.closest('tr');
            const name = row.querySelector('.employee-name').textContent;
            const id = row.cells[1].textContent;
            const dept = row.cells[2].textContent;
            alert(`Employee: ${name}\nUser ID: ${id}\nDepartment: ${dept}`);
        };
    });
    document.querySelectorAll('.action-icon.edit').forEach(btn => {
        btn.onclick = () => alert("Edit feature not yet implemented.");
    });
    document.querySelectorAll('.action-icon.delete').forEach(btn => {
        btn.onclick = () => alert("Delete feature not yet implemented.");
    });
}

// Pagination event handlers
document.addEventListener("DOMContentLoaded", () => {
    loadDepartments(() => {
        loadEmployees();
        document.querySelector('.search-input').addEventListener('input', renderEmployeeTable);
        document.getElementById('deptFilter').addEventListener('change', () => { currentPage = 1; renderEmployeeTable(); });
        document.getElementById('statusFilter').addEventListener('change', () => { currentPage = 1; renderEmployeeTable(); });
        document.querySelector('.page-btn.prev').addEventListener('click', () => { if(currentPage > 1) { currentPage--; renderEmployeeTable(); } });
        document.querySelector('.page-btn.next').addEventListener('click', () => { currentPage++; renderEmployeeTable(); });
    });
});
