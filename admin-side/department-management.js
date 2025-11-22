// department-management.js

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000';

    const cardsSection = document.querySelector('.dept-cards-section');
    const deptTableBody = document.querySelector('.dept-table tbody');
    const searchInput = document.querySelector('.search-input');

    let hrAdmin = null; // Store HR/Admin info

    // --- Fetch HR/Admin user ---
    async function fetchHRAdmin() {
        try {
            const response = await fetch(`${API_BASE_URL}/users?role=HR/Admin`);
            const users = await response.json();
            if (users.length > 0) {
                hrAdmin = users[0]; // Get the first HR/Admin user
            }
        } catch (error) {
            console.error('Error fetching HR/Admin:', error);
        }
    }

    // --- Fetch & Render Departments ---
    async function loadDepartments() {
        try {
            await fetchHRAdmin(); // Fetch HR first

            const response = await fetch(`${API_BASE_URL}/departments`);
            const departments = await response.json();

            renderDepartmentCards(departments);
            renderDepartmentTable(departments);
        } catch (error) {
            cardsSection.innerHTML = "<p>Unable to load departments.</p>";
            deptTableBody.innerHTML = "<tr><td colspan='4'>Unable to load departments.</td></tr>";
        }
    }

    // --- Render Cards ---
    function renderDepartmentCards(depts) {
        cardsSection.innerHTML = '';
        for (const dept of depts) {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'dept-card';
            cardDiv.innerHTML = `
                <div class="dept-card-header">
                    <div class="dept-icon-box blue-dept">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2"/>
                            <path d="M3 9h18M9 21V9"/>
                        </svg>
                    </div>
                </div>
                <h3 class="dept-card-title">${dept.name || 'No name'}</h3>
                <div class="dept-card-info">
                    <div class="dept-info-item">
                        <span class="info-label">HR/Admin</span>
                        <span class="info-value">${hrAdmin ? hrAdmin.username : 'Not set'}</span>
                    </div>
                    <div class="dept-info-item">
                        <span class="info-label">Total Employees</span>
                        <span class="info-value" id="emp-count-${dept.id}">...</span>
                    </div>
                </div>
                <button class="view-details-btn" data-id="${dept.id}">View Details</button>
            `;
            cardsSection.appendChild(cardDiv);

            // Fetch and render employee count
            fetch(`${API_BASE_URL}/employees?department_name=${encodeURIComponent(dept.name)}`)
                .then(r => r.json())
                .then(emps => {
                    const countEl = document.getElementById(`emp-count-${dept.id}`);
                    if (countEl) countEl.textContent = emps.length;
                })
                .catch(err => console.error('Error fetching employees:', err));

            // View Details event
            cardDiv.querySelector('.view-details-btn').addEventListener('click', () => {
                viewDepartmentDetails(dept);
            });
        }
    }

    // --- Render Table list ---
    function renderDepartmentTable(depts) {
        deptTableBody.innerHTML = '';
        for (const dept of depts) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${dept.name || 'No name'}</td>
                <td>${hrAdmin ? hrAdmin.username : 'Not set'}</td>
                <td><span class="employee-count" id="table-count-${dept.id}">...</span></td>
                <td>
                    <button class="view-details-btn" data-id="${dept.id}">View Details</button>
                </td>
            `;
            deptTableBody.appendChild(tr);

            // Fetch and render employee count in table
            fetch(`${API_BASE_URL}/employees?department_name=${encodeURIComponent(dept.name)}`)
                .then(r => r.json())
                .then(emps => {
                    const countEl = document.getElementById(`table-count-${dept.id}`);
                    if (countEl) countEl.textContent = `${emps.length} employees`;
                })
                .catch(err => console.error('Error fetching employees:', err));

            // View Details event
            tr.querySelector('.view-details-btn').addEventListener('click', () => {
                viewDepartmentDetails(dept);
            });
        }
    }

    // --- View Department Details ---
    async function viewDepartmentDetails(dept) {
        try {
            const res = await fetch(`${API_BASE_URL}/employees?department_name=${encodeURIComponent(dept.name)}`);
            const employees = await res.json();

            // Build modal content
            let html = `
                <h2>${dept.name}</h2>
                <p><strong>HR/Admin:</strong> ${hrAdmin ? hrAdmin.username : 'Not set'}</p>
                <p><strong>Total Employees:</strong> ${employees.length}</p>
                <h3>Employees:</h3>
            `;

            if (employees.length === 0) {
                html += `<p>No employees found in this department.</p>`;
            } else {
                html += '<ul>';
                for (const emp of employees) {
                    html += `<li>${emp.first_name || ''} ${emp.last_name || ''} (${emp.position || 'N/A'})</li>`;
                }
                html += '</ul>';
            }

            showModal(html);
        } catch (error) {
            showModal('<p>Unable to load employee details.</p>');
        }
    }

    // --- Simple Modal ---
    function showModal(contentHtml) {
        let modal = document.getElementById('dept-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dept-modal';
            modal.style.position = 'fixed';
            modal.style.left = '50%';
            modal.style.top = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            modal.style.background = '#fff';
            modal.style.padding = '32px';
            modal.style.borderRadius = '12px';
            modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
            modal.style.zIndex = '9999';
            modal.style.maxWidth = '600px';
            modal.style.maxHeight = '80vh';
            modal.style.overflow = 'auto';
            document.body.appendChild(modal);
        }
        modal.innerHTML = contentHtml + '<br><br><button onclick="document.getElementById(\'dept-modal\').remove()" style="padding: 8px 16px; background: #4F46E5; color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>';
    }

    // --- Search Filter ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const v = e.target.value.trim().toLowerCase();
            for (const card of cardsSection.children) {
                const name = card.querySelector('.dept-card-title').textContent.toLowerCase();
                card.style.display = name.includes(v) ? '' : 'none';
            }
            for (const tr of deptTableBody.children) {
                const tds = tr.getElementsByTagName('td');
                if (tds.length > 0) {
                    const name = tds[0].textContent.toLowerCase();
                    tr.style.display = name.includes(v) ? '' : 'none';
                }
            }
        });
    }

    // --- Init ---
    loadDepartments();
});
