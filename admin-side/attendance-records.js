document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000';
    const POLL_INTERVAL = 10000;

    const elements = {
        statPresent: document.getElementById('statPresent'),
        statAbsent: document.getElementById('statAbsent'),
        statLate: document.getElementById('statLate'),
        statRate: document.getElementById('statRate'),
        employeeFilter: document.getElementById('employeeFilter'),
        dateFromFilter: document.getElementById('dateFromFilter'),
        dateToFilter: document.getElementById('dateToFilter'),
        departmentFilter: document.getElementById('departmentFilter'),
        statusFilter: document.getElementById('statusFilter'),
        applyBtn: document.getElementById('applyFiltersBtn'),
        resetBtn: document.getElementById('resetFiltersBtn'),
        filtersForm: document.getElementById('filtersForm'),
        tableBody: document.getElementById('attendanceRecordsBody'),
        paginationInfo: document.getElementById('paginationInfo'),
        lastUpdatedLabel: document.getElementById('lastUpdatedLabel'),
        liveBadge: document.getElementById('liveBadge'),
        updateIndicator: document.getElementById('updateIndicator')
    };

    const state = {
        filters: {},
        recordsSignature: new Map(),
        hasRenderedOnce: false,
        pollHandle: null,
        indicatorTimeout: null,
        badgeTimeout: null
    };

    function formatDate(date) {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        return `${d.getFullYear()}-${month}-${day}`;
    }

    function prettyDate(date) {
        if (!date) return '—';
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return date;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function prettyTime(timeValue) {
        if (!timeValue) return '—';
        return timeValue.toString().slice(0, 5);
    }

    function getMonthRange() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            start: formatDate(start),
            end: formatDate(now)
        };
    }

    function getTodayRange() {
        const todayISO = formatDate(new Date());
        return {
            start_date: todayISO,
            end_date: todayISO
        };
    }

    function setDefaultDates() {
        const { start, end } = getMonthRange();
        elements.dateFromFilter.value = start;
        elements.dateToFilter.value = end;
    }

    function bindEvents() {
        elements.filtersForm.addEventListener('submit', (event) => {
            event.preventDefault();
            state.filters = collectFilters();
            refreshData();
        });

        elements.resetBtn.addEventListener('click', () => {
            elements.employeeFilter.value = 'all';
            elements.departmentFilter.value = 'all';
            elements.statusFilter.value = 'all';
            setDefaultDates();
            state.filters = collectFilters();
            refreshData();
        });
    }

    function collectFilters() {
        const filters = {
            employee_id: elements.employeeFilter.value,
            start_date: elements.dateFromFilter.value,
            end_date: elements.dateToFilter.value,
            department: elements.departmentFilter.value,
            status: elements.statusFilter.value
        };

        Object.keys(filters).forEach((key) => {
            if (!filters[key] || filters[key] === 'all') {
                delete filters[key];
            }
        });

        return filters;
    }

    function buildQuery(params) {
        const search = new URLSearchParams();
        Object.entries(params || {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                search.append(key, value);
            }
        });
        return search.toString();
    }

    async function fetchEmployees() {
        try {
            const response = await fetch(`${API_BASE_URL}/employees`);
            if (!response.ok) throw new Error('Failed to load employees');
            const employees = await response.json();
            const fragment = document.createDocumentFragment();
            employees.forEach((employee) => {
                const option = document.createElement('option');
                option.value = employee.id;
                option.textContent = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || `Employee #${employee.id}`;
                fragment.appendChild(option);
            });
            elements.employeeFilter.appendChild(fragment);
        } catch (error) {
            console.warn('Unable to populate employee list.', error);
        }
    }

    async function fetchStats(filters) {
        const query = buildQuery(filters);
        const response = await fetch(`${API_BASE_URL}/attendance/admin/stats?${query}`);
        if (!response.ok) throw new Error('Unable to fetch stats');
        return response.json();
    }

    async function fetchRecords(filters) {
        const query = buildQuery({ ...filters, limit: 150 });
        const response = await fetch(`${API_BASE_URL}/attendance/admin?${query}`);
        if (!response.ok) throw new Error('Unable to fetch attendance records');
        return response.json();
    }

    function renderStats(stats) {
        elements.statPresent.textContent = stats.total_present ?? 0;
        elements.statAbsent.textContent = stats.total_absent ?? 0;
        elements.statLate.textContent = stats.total_lates ?? 0;
        const rate = Number(stats.attendance_rate ?? 0).toFixed(1);
        elements.statRate.textContent = `${rate}%`;
    }

    function deriveTotalHours(entry) {
        if (entry.total_hours !== undefined && entry.total_hours !== null && entry.total_hours !== '') {
            const value = Number(entry.total_hours);
            if (!Number.isNaN(value)) return `${value.toFixed(2)} hrs`;
        }

        const timeIn = entry.time_in ? entry.time_in.slice(0, 5) : null;
        const timeOut = entry.time_out ? entry.time_out.slice(0, 5) : null;

        const toMinutes = (timeValue) => {
            if (!timeValue) return null;
            const [h, m] = timeValue.split(':').map(Number);
            if (Number.isNaN(h) || Number.isNaN(m)) return null;
            return h * 60 + m;
        };

        const start = toMinutes(timeIn);
        const end = toMinutes(timeOut);

        if (start === null || end === null || end <= start) return '—';
        return `${((end - start) / 60).toFixed(2)} hrs`;
    }

    function getAvatarInitials(name) {
        if (!name) return 'NA';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function renderRecords(records) {
        if (!records.length) {
            elements.tableBody.innerHTML = `
                <tr class="placeholder-row">
                    <td colspan="9">No attendance logs found for the selected filters.</td>
                </tr>
            `;
            elements.paginationInfo.textContent = 'Showing 0 records';
            state.recordsSignature.clear();
            return;
        }

        const rowsHtml = records.map((entry) => {
            const employeeName = entry.employee_name?.trim() || `Employee #${entry.employee_id}`;
            const initials = getAvatarInitials(employeeName);
            const department = entry.department_name || 'Unassigned';
            const statusKey = (entry.status || '').toLowerCase();
            const statusLabel = entry.status || 'Present';
            const remarks = entry.remarks || '—';
            return `
                <tr data-id="${entry.id}">
                    <td>
                        <div class="employee-info">
                            <div class="avatar" data-name="${initials}">${initials}</div>
                            <div class="employee-meta">
                                <span class="employee-name">${employeeName}</span>
                                <span class="department-chip">${department}</span>
                            </div>
                        </div>
                    </td>
                    <td>${entry.employee_id ?? '—'}</td>
                    <td>${department}</td>
                    <td>${prettyDate(entry.date)}</td>
                    <td>${prettyTime(entry.time_in)}</td>
                    <td>${prettyTime(entry.time_out)}</td>
                    <td>${deriveTotalHours(entry)}</td>
                    <td><span class="status-badge ${statusKey}">${statusLabel}</span></td>
                    <td>${remarks}</td>
                </tr>
            `;
        }).join('');

        elements.tableBody.innerHTML = rowsHtml;
        elements.paginationInfo.textContent = `Showing ${records.length} record${records.length === 1 ? '' : 's'}`;

        applyRowHighlights(records);
    }

    function applyRowHighlights(records) {
        const map = new Map();
        let hasChanges = false;

        records.forEach((entry) => {
            const signature = JSON.stringify([
                entry.date,
                entry.time_in,
                entry.time_out,
                entry.status,
                entry.total_hours,
                entry.remarks
            ]);
            map.set(entry.id, signature);
        });

        if (state.hasRenderedOnce) {
            records.forEach((entry) => {
                const previous = state.recordsSignature.get(entry.id);
                const currentSignature = map.get(entry.id);
                const row = elements.tableBody.querySelector(`tr[data-id="${entry.id}"]`);
                if (!row) return;

                if (!previous) {
                    highlightRow(row, 'row-highlight');
                    hasChanges = true;
                } else if (previous !== currentSignature) {
                    highlightRow(row, 'row-updated');
                    hasChanges = true;
                }
            });
        }

        state.recordsSignature = map;
        state.hasRenderedOnce = true;

        if (hasChanges) {
            triggerUpdateFeedback();
        }
    }

    function highlightRow(row, className) {
        row.classList.add(className);
        setTimeout(() => row.classList.remove(className), 2500);
    }

    function triggerUpdateFeedback() {
        elements.updateIndicator.textContent = 'Updated just now';
        elements.updateIndicator.classList.add('show');
        elements.liveBadge.classList.add('show');

        clearTimeout(state.indicatorTimeout);
        clearTimeout(state.badgeTimeout);

        state.indicatorTimeout = setTimeout(() => {
            elements.updateIndicator.classList.remove('show');
        }, 3000);

        state.badgeTimeout = setTimeout(() => {
            elements.liveBadge.classList.remove('show');
        }, 3000);
    }

    function updateLastUpdatedLabel() {
        const now = new Date();
        elements.lastUpdatedLabel.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    async function refreshData(initialLoad = false) {
        try {
            const filters = state.filters;
            const [stats, records] = await Promise.all([
                fetchStats(getTodayRange()),
                fetchRecords(filters)
            ]);

            renderStats(stats);
            renderRecords(records);
            updateLastUpdatedLabel();

            if (!initialLoad && !records.length) {
                // No rows but still show indicator to confirm sync
                triggerUpdateFeedback();
            }
        } catch (error) {
            console.error('Attendance data sync failed:', error);
            elements.tableBody.innerHTML = `
                <tr class="placeholder-row">
                    <td colspan="9">Unable to load attendance records. Please try again later.</td>
                </tr>
            `;
            elements.paginationInfo.textContent = 'Showing 0 records';
        }
    }

    async function init() {
        setDefaultDates();
        bindEvents();
        await fetchEmployees();
        state.filters = collectFilters();
        await refreshData(true);
        state.pollHandle = setInterval(refreshData, POLL_INTERVAL);
    }

    init();
});

