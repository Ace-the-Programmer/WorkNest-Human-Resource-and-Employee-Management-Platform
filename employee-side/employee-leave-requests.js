// MODAL TOGGLE
const leaveModal = document.getElementById('leaveModal');
document.querySelector('.apply-btn').onclick = () => leaveModal.style.display = 'block';
document.getElementById('closeLeaveModal').onclick = () => leaveModal.style.display = 'none';
window.onclick = (e) => { if (e.target == leaveModal) leaveModal.style.display = 'none'; };

// Use a real numeric employee ID
const employeeId = 46; // Change to a valid employee's id from your database

// SUBMIT LEAVE REQUEST
document.getElementById('leaveRequestForm').onsubmit = async function(e) {
  e.preventDefault();
  const data = {
    employee_id: employeeId,
    leave_type: document.getElementById('leaveType').value,
    start_date: document.getElementById('leaveFrom').value,
    end_date: document.getElementById('leaveTo').value,
    reason: document.getElementById('leaveReason').value
  };
  const days = (new Date(data.end_date) - new Date(data.start_date)) / (1000*60*60*24) + 1;
  if (days < 1) return alert('Invalid date range!');
  try {
    const res = await fetch('http://localhost:3000/api/leave-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res.ok) {
      alert('Leave request submitted.');
      leaveModal.style.display = 'none';
      loadLeaveHistory();
    } else {
      alert('Error submitting leave request.');
    }
  } catch {
    alert('Server error.');
  }
};

// DISPLAY LEAVE HISTORY
async function loadLeaveHistory() {
  const tableBody = document.querySelector('.leave-table tbody');
  tableBody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
  try {
    const res = await fetch(`http://localhost:3000/api/leave-requests/employee/${employeeId}`);
    const data = await res.json();
    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7">No leave requests found.</td></tr>';
    } else {
      tableBody.innerHTML = data.map(row => `
        <tr>
          <td><span class="leave-type-badge ${row.leave_type.toLowerCase().replace(' ', '')}">${row.leave_type}</span></td>
          <td>${row.date_filed ? new Date(row.date_filed).toLocaleDateString() : ''}</td>
          <td>${row.start_date} - ${row.end_date}</td>
          <td>${(new Date(row.end_date) - new Date(row.start_date))/86400000+1} days</td>
          <td><span class="status-badge ${row.status.toLowerCase()}">${row.status}</span></td>
          <td>${row.reason || ''}</td>
          <td>
            <button class="action-btn" title="View">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch {
    tableBody.innerHTML = '<tr><td colspan="7">Error loading data.</td></tr>';
  }
}

loadLeaveHistory();
