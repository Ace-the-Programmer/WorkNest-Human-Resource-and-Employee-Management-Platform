document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('addLogModal');
    const openBtn = document.getElementById('openAddLogModal');
    const closeBtn = document.getElementById('closeAddLogModal');
    const cancelBtn = document.getElementById('cancelAddLog');
    const form = document.getElementById('addLogForm');
    const dateInput = document.getElementById('logDate');
    const timeInInput = document.getElementById('timeIn');
    const timeOutInput = document.getElementById('timeOut');
    const statusSelect = document.getElementById('status');
    const remarksInput = document.getElementById('remarks');
    const totalHoursInput = document.getElementById('totalHours');
    const errorBox = document.getElementById('formError');
    const tableBody = document.getElementById('attendanceTableBody');
    const totalPresentValue = document.getElementById('totalPresentValue');
    const totalLatesValue = document.getElementById('totalLatesValue');
    const totalAbsencesValue = document.getElementById('totalAbsencesValue');
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonthLabel = document.getElementById('calendarMonthLabel');
    const thisMonthBtn = document.getElementById('thisMonthBtn');
    const lastMonthBtn = document.getElementById('lastMonthBtn');

    const WORK_START_MINUTES = 9 * 60; // 9:00 AM
    const API_BASE_URL = 'http://localhost:3000';
    const ATTENDANCE_ENDPOINT = `${API_BASE_URL}/attendance`;
    const ATTENDANCE_SUMMARY_ENDPOINT = `${API_BASE_URL}/attendance/summary`;
    const ATTENDANCE_MONTHLY_ENDPOINT = `${API_BASE_URL}/attendance/monthly`;
    const STATUS_API_MAP = {
        present: 'Present',
        late: 'Late',
        absent: 'Absent',
        leave: 'Leave',
        weekend: 'Weekend'
    };
    const STATUS_LABELS = {
        present: 'Present',
        late: 'Late',
        absent: 'Absent',
        leave: 'Leave',
        weekend: 'Weekend'
    };

    const existingDates = new Set();
    let statusManuallyChanged = false;
    let currentMonthOffset = 0;
    let employeeId = null;

    // Helpers
    function normalizeDate(dateValue) {
        if (!dateValue) return null;
        if (typeof dateValue === 'string') {
            const plain = dateValue.slice(0, 10);
            if (/^\d{4}-\d{2}-\d{2}$/.test(plain)) {
                return plain;
            }
        }

        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
    }

    function timeToMinutes(timeValue) {
        if (!timeValue) return null;
        const [hours, minutes] = timeValue.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
        return hours * 60 + minutes;
    }

    function calculateTotalHours() {
        const timeIn = timeToMinutes(timeInInput.value);
        const timeOut = timeToMinutes(timeOutInput.value);

        if (timeIn === null || timeOut === null || timeOut <= timeIn) {
            totalHoursInput.value = '';
            return null;
        }

        const diff = timeOut - timeIn;
        const hours = (diff / 60).toFixed(2);
        totalHoursInput.value = `${hours} hrs`;
        return hours;
    }

    function generateRemarks(status, timeInMinutes) {
        switch (status) {
            case 'late':
                return 'Late arrival';
            case 'absent':
                return 'Marked absent';
            case 'leave':
                return 'On approved leave';
            case 'weekend':
                return 'Weekend rest day';
            case 'present':
            default:
                if (timeInMinutes === null) return 'Awaiting time entry';
                return timeInMinutes > WORK_START_MINUTES ? 'Late arrival' : 'On time';
        }
    }

    function updateRemarksPreview() {
        const status = statusSelect.value;
        const timeInMinutes = timeToMinutes(timeInInput.value);
        remarksInput.value = generateRemarks(status, timeInMinutes);
    }

    function updateStatusSuggestion(force = false) {
        if (!statusManuallyChanged || force) {
            const timeIn = timeToMinutes(timeInInput.value);
            if (timeIn === null) return;
            statusSelect.value = timeIn > WORK_START_MINUTES ? 'late' : 'present';
        }
        updateRemarksPreview();
    }

    function resetForm() {
        form.reset();
        statusManuallyChanged = false;
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        totalHoursInput.value = '';
        remarksInput.value = '';
        hideError();
    }

    function showError(message) {
        errorBox.textContent = message;
        errorBox.classList.add('show');
    }

    function hideError() {
        errorBox.textContent = '';
        errorBox.classList.remove('show');
    }

    function getEmployeeId() {
        try {
            const raw = localStorage.getItem('user');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed?.employee_id || null;
        } catch (error) {
            console.error('Unable to parse stored user data:', error);
            return null;
        }
    }

    async function submitAttendance(payload) {
        const response = await fetch(ATTENDANCE_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let message = 'Unable to save attendance. Please try again.';
            try {
                const errorData = await response.json();
                if (errorData?.error) message = errorData.error;
            } catch (error) {
                console.error('Failed to parse error response:', error);
            }
            throw new Error(message);
        }

        return response.json();
    }

    function getTargetMonthDate() {
        const date = new Date();
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        date.setMonth(date.getMonth() + currentMonthOffset);
        return date;
    }

    function updateMonthButtons() {
        thisMonthBtn?.classList.toggle('active', currentMonthOffset === 0);
        lastMonthBtn?.classList.toggle('active', currentMonthOffset === -1);
    }

    async function fetchAllAttendanceEntries(empId) {
        const response = await fetch(`${ATTENDANCE_ENDPOINT}?employee_id=${encodeURIComponent(empId)}`);
        if (!response.ok) throw new Error('Unable to fetch attendance data.');
        return response.json();
    }

    function filterEntriesByMonth(entries, empId, month, year) {
        return entries.filter(entry => {
            if (Number(entry.employee_id) !== Number(empId)) return false;
            const iso = normalizeDate(entry.date);
            if (!iso) return false;
            const date = new Date(iso);
            return (date.getMonth() + 1) === month && date.getFullYear() === year;
        });
    }

    function buildStatsFromEntries(entries) {
        return entries.reduce((acc, entry) => {
            const statusKey = (entry.status || '').toLowerCase();
            if (statusKey === 'present') acc.total_present += 1;
            if (statusKey === 'late') acc.total_lates += 1;
            if (statusKey === 'absent') acc.total_absences += 1;
            return acc;
        }, { total_present: 0, total_lates: 0, total_absences: 0 });
    }

    async function fetchMonthlyStats(empId, month, year) {
        const params = new URLSearchParams({ employee_id: empId, month, year });
        try {
            const response = await fetch(`${ATTENDANCE_SUMMARY_ENDPOINT}?${params.toString()}`);
            if (!response.ok) throw new Error('summary-endpoint-error');
            return await response.json();
        } catch (error) {
            console.warn('Summary endpoint unavailable, falling back to client-side calculation.', error);
            const allEntries = await fetchAllAttendanceEntries(empId);
            const monthlyEntries = filterEntriesByMonth(allEntries, empId, month, year);
            return buildStatsFromEntries(monthlyEntries);
        }
    }

    async function fetchMonthlyEntries(empId, month, year) {
        const params = new URLSearchParams({ employee_id: empId, month, year });
        try {
            const response = await fetch(`${ATTENDANCE_MONTHLY_ENDPOINT}?${params.toString()}`);
            if (!response.ok) throw new Error('monthly-endpoint-error');
            return await response.json();
        } catch (error) {
            console.warn('Monthly endpoint unavailable, falling back to filtered attendance data.', error);
            const allEntries = await fetchAllAttendanceEntries(empId);
            return filterEntriesByMonth(allEntries, empId, month, year);
        }
    }

    function updateStatsCards(stats) {
        totalPresentValue.textContent = stats.total_present || 0;
        totalLatesValue.textContent = stats.total_lates || 0;
        totalAbsencesValue.textContent = stats.total_absences || 0;
    }

    function deriveTotalHours(entry) {
        if (entry.total_hours !== undefined && entry.total_hours !== null && entry.total_hours !== '') {
            const numeric = Number(entry.total_hours);
            if (!Number.isNaN(numeric)) {
                return `${numeric.toFixed(2)} hrs`;
            }
        }

        const minutesIn = timeToMinutes(entry.time_in?.slice(0, 5));
        const minutesOut = timeToMinutes(entry.time_out?.slice(0, 5));

        if (minutesIn === null || minutesOut === null || minutesOut <= minutesIn) {
            return '—';
        }

        const hours = ((minutesOut - minutesIn) / 60).toFixed(2);
        return `${hours} hrs`;
    }

    function renderTable(entries) {
        if (!tableBody) return;

        if (!entries.length) {
            tableBody.innerHTML = `
                <tr class="placeholder-row">
                    <td colspan="6">No attendance logs for this month yet.</td>
                </tr>
            `;
            return;
        }

        const rows = entries
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(entry => {
                const isoDate = normalizeDate(entry.date);
                const displayDate = isoDate
                    ? new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : entry.date;

                const statusKey = (entry.status || '').toLowerCase();
                const badgeClass = STATUS_LABELS[statusKey] ? statusKey : 'present';
                const badgeLabel = STATUS_LABELS[statusKey] || entry.status || 'Present';

                const formatTime = (timeValue) => (timeValue ? timeValue.slice(0, 5) : '—');
                const totalHours = deriveTotalHours(entry);
                const remarks = entry.remarks || generateRemarks(statusKey, timeToMinutes(entry.time_in));

                return `
                    <tr>
                        <td>${displayDate}</td>
                        <td>${formatTime(entry.time_in)}</td>
                        <td>${formatTime(entry.time_out)}</td>
                        <td>${totalHours}</td>
                        <td><span class="status-badge ${badgeClass}">${badgeLabel}</span></td>
                        <td>${remarks}</td>
                    </tr>
                `;
            }).join('');

        tableBody.innerHTML = rows;
    }

    function renderCalendar(entries) {
        if (!calendarGrid) return;

        const targetDate = getTargetMonthDate();
        const year = targetDate.getFullYear();
        const monthIndex = targetDate.getMonth();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const firstDay = new Date(year, monthIndex, 1).getDay();

        const dateMap = entries.reduce((acc, entry) => {
            const iso = normalizeDate(entry.date);
            if (iso) {
                acc[iso] = (entry.status || '').toLowerCase();
            }
            return acc;
        }, {});

        calendarGrid.innerHTML = '';
        calendarMonthLabel.textContent = targetDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('div');
            cell.classList.add('calendar-day');
            cell.textContent = day;

            const isoDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const statusKey = dateMap[isoDate];

            if (statusKey && STATUS_LABELS[statusKey]) {
                cell.classList.add(statusKey);
            } else {
                const dayOfWeek = new Date(year, monthIndex, day).getDay();
                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    cell.classList.add('weekend-empty');
                } else {
                    cell.classList.add('no-status');
                }
            }

            calendarGrid.appendChild(cell);
        }

        const totalCells = calendarGrid.children.length;
        const remainder = totalCells % 7;
        if (remainder !== 0) {
            for (let i = 0; i < 7 - remainder; i++) {
                const emptyCell = document.createElement('div');
                emptyCell.className = 'calendar-day empty';
                calendarGrid.appendChild(emptyCell);
            }
        }
    }

    async function loadAttendanceData() {
        if (!employeeId) return;
        const targetDate = getTargetMonthDate();
        const month = targetDate.getMonth() + 1;
        const year = targetDate.getFullYear();

        try {
            const [stats, entries] = await Promise.all([
                fetchMonthlyStats(employeeId, month, year),
                fetchMonthlyEntries(employeeId, month, year)
            ]);

            updateStatsCards(stats);
            renderTable(entries);
            renderCalendar(entries);

            if (currentMonthOffset === 0) {
                existingDates.clear();
                entries.forEach(entry => {
                    const iso = normalizeDate(entry.date);
                    if (iso) existingDates.add(iso);
                });
            }
        } catch (error) {
            console.error(error);
            showError(error.message);
        }
    }

    async function ensureCurrentMonthData() {
        if (currentMonthOffset !== 0 || !existingDates.size) {
            currentMonthOffset = 0;
            updateMonthButtons();
            await loadAttendanceData();
        }
    }

    async function openModal() {
        await ensureCurrentMonthData();
        resetForm();
        updateStatusSuggestion(true);
        updateRemarksPreview();
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setTimeout(() => dateInput.focus(), 0);
    }

    function closeModal() {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // Event wiring
    openBtn?.addEventListener('click', openModal);
    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);
    modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal?.classList.contains('show')) {
            closeModal();
        }
    });

    statusSelect?.addEventListener('change', () => {
        statusManuallyChanged = true;
        updateRemarksPreview();
    });

    timeInInput?.addEventListener('input', () => {
        calculateTotalHours();
        updateStatusSuggestion();
        updateRemarksPreview();
    });

    timeOutInput?.addEventListener('input', calculateTotalHours);

    thisMonthBtn?.addEventListener('click', () => {
        currentMonthOffset = 0;
        updateMonthButtons();
        loadAttendanceData();
    });

    lastMonthBtn?.addEventListener('click', () => {
        currentMonthOffset = -1;
        updateMonthButtons();
        loadAttendanceData();
    });

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideError();

        if (!employeeId) {
            showError('Missing employee information. Please log in again.');
            return;
        }

        const dateValue = dateInput.value;
        const timeInValue = timeInInput.value;
        const timeOutValue = timeOutInput.value;
        const statusValue = statusSelect.value;

        if (!dateValue || !timeInValue || !timeOutValue || !statusValue) {
            showError('Please fill in all required fields.');
            return;
        }

        const dateISO = normalizeDate(dateValue);
        if (!dateISO) {
            showError('Please provide a valid date.');
            return;
        }

        if (existingDates.has(dateISO)) {
            showError('An entry for this date already exists.');
            return;
        }

        const timeInMinutes = timeToMinutes(timeInValue);
        const timeOutMinutes = timeToMinutes(timeOutValue);

        if (timeInMinutes === null || timeOutMinutes === null) {
            showError('Please provide valid time values.');
            return;
        }

        if (timeOutMinutes <= timeInMinutes) {
            showError('Time Out must be later than Time In.');
            return;
        }

        const totalHoursValue = ((timeOutMinutes - timeInMinutes) / 60).toFixed(2);
        const totalHoursDisplay = `${totalHoursValue} hrs`;
        totalHoursInput.value = totalHoursDisplay;
        const remarksValue = generateRemarks(statusValue, timeInMinutes);
        remarksInput.value = remarksValue;

        const payload = {
            employee_id: employeeId,
            date: dateISO,
            time_in: timeInValue,
            time_out: timeOutValue,
            total_hours: totalHoursValue,
            remarks: remarksValue,
            status: STATUS_API_MAP[statusValue] || STATUS_API_MAP.present
        };

        try {
            await submitAttendance(payload);
            existingDates.add(dateISO);
            await loadAttendanceData();
            closeModal();
        } catch (error) {
            console.error(error);
            showError(error.message);
        }
    });

    employeeId = getEmployeeId();
    updateMonthButtons();
    if (employeeId) {
        loadAttendanceData();
    } else {
        showError('Unable to load data. Please log in again.');
    }
});

