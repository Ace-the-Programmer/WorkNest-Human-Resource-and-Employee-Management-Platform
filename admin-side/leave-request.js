const API_URL = "http://localhost:3000/api/leave-requests";

const tabs = [
    { btn: null, status: 'Pending' },
    { btn: null, status: 'Approved' },
    { btn: null, status: 'Declined' }
];

document.querySelectorAll('.tab-btn').forEach((button, idx) => {
    tabs[idx].btn = button;
    button.addEventListener('click', () => {
        document.querySelector('.tab-btn.active').classList.remove('active');
        button.classList.add('active');
        loadLeaveRequests(tabs[idx].status);
    });
});

window.addEventListener('DOMContentLoaded', () => loadLeaveRequests('Pending'));

async function loadLeaveRequests(status = 'Pending') {
    const tbody = document.querySelector('.leave-table tbody');
    const thead = document.querySelector('.leave-table thead tr');
    
    tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;
    
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        
        // Fetch all employees to map IDs to names
        const empRes = await fetch('http://localhost:3000/employees');
        const employees = await empRes.json();
        
        // Create a map of employee_id to name
        const employeeMap = {};
        employees.forEach(emp => {
            employeeMap[emp.id] = `${emp.first_name} ${emp.last_name}`;
        });
        
        const filtered = data.filter(req => req.status === status);
        
        // Show/hide Actions column based on status
        const showActionsColumn = status === 'Pending';
        updateTableHeaders(showActionsColumn);
        
        if (filtered.length === 0) {
            const colSpan = showActionsColumn ? 8 : 7;
            tbody.innerHTML = `<tr><td colspan="${colSpan}">No ${status.toLowerCase()} requests.</td></tr>`;
            setTabCounts(data);
            return;
        }
        
        tbody.innerHTML = filtered.map(row => {
            const employeeName = employeeMap[row.employee_id] || `Employee #${row.employee_id}`;
            const totalDays = getTotalDays(row.start_date, row.end_date);
            const dateFiled = row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'N/A';
            
            return `
                <tr>
                    <td><strong>${employeeName}</strong><br><small>ID: ${row.employee_id}</small></td>
                    <td><span class="leave-type-tag">${row.leave_type}</span></td>
                    <td>${formatDate(row.start_date)} - ${formatDate(row.end_date)}</td>
                    <td>${totalDays}</td>
                    <td>${dateFiled}</td>
                    <td><span class="status-badge ${row.status.toLowerCase()}">${row.status}</span></td>
                    <td>${row.reason || 'No reason provided'}</td>
                    ${showActionsColumn ? `
                        <td>
                            <button class="action-btn approve" data-id="${row.id}">
                                Approve
                            </button>
                            <button class="action-btn decline" data-id="${row.id}">
                                Decline
                            </button>
                        </td>
                    ` : ''}
                </tr>
            `;
        }).join('');
        
        setTabCounts(data);
        
        if (showActionsColumn) {
            addActionListeners();
        }
    } catch (err) {
        console.error('Error:', err);
        tbody.innerHTML = `<tr><td colspan="8">Error loading data. Please refresh the page.</td></tr>`;
    }
}

function updateTableHeaders(showActionsColumn) {
    const thead = document.querySelector('.leave-table thead tr');
    
    // Define headers
    const headers = [
        'Employee Name',
        'Leave Type',
        'Date Range',
        'Total Days',
        'Date Filed',
        'Status',
        'Reason'
    ];
    
    if (showActionsColumn) {
        headers.push('Actions');
    }
    
    // Update table headers
    thead.innerHTML = headers.map(header => `<th>${header}</th>`).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTotalDays(from, to) {
    const start = new Date(from);
    const end = new Date(to);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? `${diff} day${diff > 1 ? "s" : ""}` : "Invalid";
}

function setTabCounts(data) {
    const statusCounts = { Pending: 0, Approved: 0, Declined: 0 };
    data.forEach(row => {
        if (statusCounts.hasOwnProperty(row.status)) {
            statusCounts[row.status]++;
        }
    });
    document.querySelectorAll('.tab-count').forEach((span, idx) =>
        span.textContent = statusCounts[tabs[idx].status] || 0
    );
}

function addActionListeners() {
    document.querySelectorAll('.action-btn.approve').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to approve this leave request?')) {
                await updateLeaveStatus(id, 'Approved');
            }
        };
    });
    
    document.querySelectorAll('.action-btn.decline').forEach(btn => {
        btn.onclick = async () => {
            const id = btn.getAttribute('data-id');
            if (confirm('Are you sure you want to decline this leave request?')) {
                await updateLeaveStatus(id, 'Declined');
            }
        };
    });
}

async function updateLeaveStatus(id, newStatus) {
    try {
        const res = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (res.ok) {
            alert(`Request ${newStatus.toLowerCase()} successfully!`);
            // Reload the current active tab
            const activeTab = document.querySelector('.tab-btn.active').textContent.trim().split('\n')[0].trim();
            loadLeaveRequests(activeTab);
        } else {
            const errorData = await res.json();
            alert(`Error updating status: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Server error. Please try again.");
    }
}
