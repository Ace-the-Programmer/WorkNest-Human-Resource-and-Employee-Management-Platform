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
    tbody.innerHTML = `<tr><td colspan="8">Loading...</td></tr>`;
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const filtered = data.filter(req => req.status === status);
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8">No ${status.toLowerCase()} requests.</td></tr>`;
            setTabCounts(data);
            return;
        }
        tbody.innerHTML = filtered.map(row => `
            <tr>
                <td>${row.employee_id}</td>
                <td>${row.leave_type}</td>
                <td>${row.start_date} - ${row.end_date}</td>
                <td>${getTotalDays(row.start_date, row.end_date)}</td>
                <td>${row.date_filed ? new Date(row.date_filed).toLocaleDateString() : ''}</td>
                <td><span class="status-badge ${row.status.toLowerCase()}">${row.status}</span></td>
                <td>${row.reason || ''}</td>
                <td>
                    <button class="action-btn approve" data-action="approve" data-id="${row.id}" ${row.status!=="Pending"?"disabled":""}>Approve</button>
                    <button class="action-btn decline" data-action="decline" data-id="${row.id}" ${row.status!=="Pending"?"disabled":""}>Decline</button>
                </td>
            </tr>
        `).join('');
        setTabCounts(data);
        addActionListeners();
    } catch (err) {
        console.error('Error:', err);
        tbody.innerHTML = `<tr><td colspan="8">Error loading data.</td></tr>`;
    }
}

function getTotalDays(from, to) {
    const start = new Date(from);
    const end = new Date(to);
    const diff = (end - start) / (1000 * 60 * 60 * 24) + 1;
    return diff > 0 ? `${diff} day${diff > 1 ? "s" : ""}` : "Invalid";
}

function setTabCounts(data) {
    const statusCounts = { Pending: 0, Approved: 0, Declined: 0 };
    data.forEach(row => statusCounts[row.status]++);
    document.querySelectorAll('.tab-count').forEach((span, idx) =>
        span.textContent = statusCounts[tabs[idx].status] || 0
    );
}

function addActionListeners() {
    document.querySelectorAll('.action-btn').forEach(btn => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === "approve" || action === "decline") {
            btn.onclick = async () => updateLeaveStatus(id, action === "approve" ? "Approved" : "Declined");
        }
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
            alert(`Request ${newStatus.toLowerCase()}!`);
            const current = document.querySelector('.tab-btn.active').textContent.trim().split('\n')[0].trim();
            loadLeaveRequests(current);
        } else {
            alert("Error updating status");
        }
    } catch (error) {
        console.error('Error:', error);
        alert("Server error");
    }
}
