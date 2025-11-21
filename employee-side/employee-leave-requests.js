// MODAL TOGGLE
const leaveModal = document.getElementById('leaveModal');
document.querySelector('.apply-btn').onclick = () => leaveModal.style.display = 'block';
document.getElementById('closeLeaveModal').onclick = () => leaveModal.style.display = 'none';
window.onclick = (e) => { if (e.target == leaveModal) leaveModal.style.display = 'none'; };

// Get logged-in employee ID from localStorage
let employeeId = null;
const userData = localStorage.getItem('user');
if (userData) {
    try {
        const user = JSON.parse(userData);
        employeeId = user.employee_id;
        
        if (!employeeId) {
            alert('Invalid user session. Please login again.');
            window.location.href = '../landing-page/portal-selection.html';
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        alert('Session error. Please login again.');
        window.location.href = '../landing-page/portal-selection.html';
    }
} else {
    alert('You are not logged in. Redirecting to login page.');
    window.location.href = '../landing-page/portal-selection.html';
}

// Global variable to store current balance
let currentBalance = null;

// SUBMIT LEAVE REQUEST WITH VALIDATION
document.getElementById('leaveRequestForm').onsubmit = async function(e) {
    e.preventDefault();
    
    const leaveType = document.getElementById('leaveType').value;
    const startDate = document.getElementById('leaveFrom').value;
    const endDate = document.getElementById('leaveTo').value;
    const reason = document.getElementById('leaveReason').value;
    
    const days = (new Date(endDate) - new Date(startDate)) / (1000*60*60*24) + 1;
    if (days < 1) {
        alert('Invalid date range! End date must be on or after start date.');
        return;
    }
    
    // Check if leave type requires balance check
    const isUnlimited = leaveType.toLowerCase().includes('emergency') || 
                       leaveType.toLowerCase().includes('maternity');
    
    // Validate available balance (only for Vacation and Sick Leave)
    if (!isUnlimited && currentBalance) {
        if (days > currentBalance.remaining) {
            alert(`⚠️ Insufficient leave balance!\n\nYou requested: ${days} day(s)\nAvailable: ${currentBalance.remaining} day(s)\n\n(Emergency and Maternity Leave are unlimited)`);
            return;
        }
    }
    
    const data = {
        employee_id: employeeId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason
    };
    
    try {
        const res = await fetch('http://localhost:3000/api/leave-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            alert('✅ Leave request submitted successfully!');
            leaveModal.style.display = 'none';
            document.getElementById('leaveRequestForm').reset();
            loadLeaveBalance();  // Refresh balance
            loadLeaveHistory();
        } else {
            const errorData = await res.json();
            alert('Error submitting leave request: ' + (errorData.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Server error. Please try again later.');
    }
};

// Load leave balance dynamically (UPDATED for single card)
async function loadLeaveBalance() {
    try {
        const res = await fetch(`http://localhost:3000/api/leave-balance/${employeeId}`);
        const balance = await res.json();
        
        // Store balance globally for validation
        currentBalance = balance;
        
        // Update the single leave card
        document.querySelector('.balance-card .balance-number').textContent = balance.remaining;
        document.querySelector('.balance-card .balance-count').innerHTML = `<span class="balance-number">${balance.remaining}</span> of ${balance.total} days`;
        const percentage = (balance.remaining / balance.total) * 100;
        document.querySelector('.balance-card .progress-fill').style.width = `${percentage}%`;
        
        // Change color based on remaining balance
        const progressBar = document.querySelector('.balance-card .progress-fill');
        if (balance.remaining === 0) {
            progressBar.style.backgroundColor = '#E74C3C'; // Red
        } else if (balance.remaining === 1) {
            progressBar.style.backgroundColor = '#F39C12'; // Orange
        } else {
            progressBar.style.backgroundColor = '#3498DB'; // Blue
        }
        
    } catch (error) {
        console.error('Error loading leave balance:', error);
    }
}

// DISPLAY LEAVE HISTORY
async function loadLeaveHistory() {
    const tableBody = document.querySelector('.leave-table tbody');
    const tableHead = document.querySelector('.leave-table thead tr');
    
    tableBody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    
    try {
        const res = await fetch(`http://localhost:3000/api/leave-requests/employee/${employeeId}`);
        const data = await res.json();
        
        updateTableHeaders();
        
        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6">No leave requests found.</td></tr>';
        } else {
            tableBody.innerHTML = data.map(row => {
                const totalDays = Math.ceil((new Date(row.end_date) - new Date(row.start_date))/86400000) + 1;
                const dateFiled = row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                }) : 'N/A';
                
                const statusClass = getStatusClass(row.status);
                const statusText = row.status || 'Pending';
                
                return `
                    <tr>
                        <td><span class="leave-type-badge ${getLeaveTypeClass(row.leave_type)}">${row.leave_type}</span></td>
                        <td>${dateFiled}</td>
                        <td>${formatDate(row.start_date)} - ${formatDate(row.end_date)}</td>
                        <td>${totalDays} day${totalDays > 1 ? 's' : ''}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${row.reason || 'N/A'}</td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = '<tr><td colspan="6">Error loading data. Please refresh the page.</td></tr>';
    }
}

function updateTableHeaders() {
    const thead = document.querySelector('.leave-table thead tr');
    const headers = ['Leave Type', 'Date Filed', 'Date Range', 'Total Days', 'Status', 'Remarks'];
    thead.innerHTML = headers.map(header => `<th>${header}</th>`).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getLeaveTypeClass(leaveType) {
    const type = leaveType.toLowerCase();
    if (type.includes('vacation')) return 'vacation';
    if (type.includes('sick')) return 'sick';
    if (type.includes('emergency')) return 'emergency';
    if (type.includes('maternity')) return 'maternity';
    return 'other';
}

function getStatusClass(status) {
    if (!status || status.trim() === '') return 'pending';
    const statusLower = status.toLowerCase().trim();
    if (statusLower === 'pending') return 'pending';
    if (statusLower === 'approved') return 'approved';
    if (statusLower === 'declined') return 'declined';
    return 'pending';
}

// Load data on page load
loadLeaveBalance();
loadLeaveHistory();
