const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const convert = require('xml-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (your frontend)
app.use('/admin', express.static('../admin-side'));
app.use('/employee', express.static('../employee-side'));
app.use('/landing', express.static('../landing-page'));

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'worknest_db',
    dateStrings: true
});

// Connect to Database
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database');
});

// Test Route
app.get('/', (req, res) => {
    res.json({ message: 'WorkNest API is running!' });
});

// ------- DEPARTMENTS MODULE -------

// Get all departments
app.get('/departments', (req, res) => {
    db.query('SELECT * FROM departments', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Get department by ID
app.get('/departments/:id', (req, res) => {
    db.query('SELECT * FROM departments WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// (Optional: Update department)
app.put('/departments/:id', (req, res) => {
    const { name, description } = req.body;
    db.query(
        'UPDATE departments SET name=?, description=? WHERE id=?',
        [name, description, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Department updated' });
        }
    );
});

// (Optional: Delete department)
app.delete('/departments/:id', (req, res) => {
    db.query('DELETE FROM departments WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Department deleted' });
    });
});

// ------- EMPLOYEES MODULE (with department filtering) -------

// Use this version to allow filtering employees by department from the frontend
app.get('/employees', (req, res) => {
    let sql = 'SELECT * FROM employees';
    const params = [];
    if (req.query.department_id) {
        sql += ' WHERE department_id = ?';
        params.push(req.query.department_id);
    }
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

/* ------- LEAVE REQUESTS MODULE ------- */
// Create new employee (auto-add department if needed)
app.post('/employees', (req, res) => {
    const { first_name, last_name, email, department_name, position, date_hired, salary, password, status,  } = req.body;

    // 1. Check if department exists by name
    db.query('SELECT id FROM departments WHERE name = ?', [department_name], (err, depResults) => {
        if (err) return res.status(500).json({ error: err });

        const insertEmployee = (department_id) => {
            db.query(
                'INSERT INTO employees (first_name, last_name, email, department_id, position, date_hired, salary, password, status, department_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [first_name, last_name, email, department_id, position, date_hired, salary, password, status],
                (err, result) => {
                    if (err) return res.status(500).json({ error: err });
                    res.json({ id: result.insertId, ...req.body, department_id });
                }
            );
        };

        if (depResults.length > 0) {
            // Department exists, use its ID
            insertEmployee(depResults[0].id);
        } else {
            // Add department first
            db.query('INSERT INTO departments (name) VALUES (?)', [department_name], (err, depResult) => {
                if (err) return res.status(500).json({ error: err });
                insertEmployee(depResult.insertId);
            });
        }
    });
});

// List all employees (optionally filter by department)
app.get('/employees', (req, res) => {
    let sql = 'SELECT * FROM employees';
    const params = [];
    if (req.query.department_id) {
        sql += ' WHERE department_id = ?';
        params.push(req.query.department_id);
    }
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Get employee by ID
app.get('/employees/:id', (req, res) => {
    db.query('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// Update employee
app.put('/employees/:id', (req, res) => {
    const { first_name, last_name, email, department_id, position, date_hired, salary, password, status, department_name } = req.body;
    db.query(
        'UPDATE employees SET first_name=?, last_name=?, email=?, department_id=?, position=?, date_hired=?, salary=?, password=?, status=? WHERE id=?',
        [first_name, last_name, email, department_id, position, date_hired, salary, password, status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Employee updated' });
        }
    );
});

// Delete employee
app.delete('/employees/:id', (req, res) => {
    db.query('DELETE FROM employees WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Employee deleted' });
    });
});

/* ------- DEPARTMENTS MODULE ------- */

// Get department by ID
app.get('/departments/:id', (req, res) => {
    db.query('SELECT * FROM departments WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// Update department
app.put('/departments/:id', (req, res) => {
    const { name, description } = req.body;
    db.query(
        'UPDATE departments SET name=?, description=? WHERE id=?',
        [name, description, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Department updated' });
        }
    );
});

// Delete department
app.delete('/departments/:id', (req, res) => {
    db.query('DELETE FROM departments WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Department deleted' });
    });
});
/* ------- ADVANCED ATTENDANCE MODULE (from your classmate) ------- */
function buildAttendanceFilterClauses(query = {}, includeDepartment = false) {
    const clauses = [];
    const values = [];
    if (query.employee_id) { clauses.push('a.employee_id = ?'); values.push(query.employee_id); }
    if (query.status) { clauses.push('LOWER(a.status) = ?'); values.push(query.status.toLowerCase()); }
    if (includeDepartment && query.department) { clauses.push('LOWER(d.name) = ?'); values.push(query.department.toLowerCase()); }
    if (query.start_date) { clauses.push('a.date >= ?'); values.push(query.start_date); }
    if (query.end_date) { clauses.push('a.date <= ?'); values.push(query.end_date); }
    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return { whereClause, values };
}
app.post('/attendance', (req, res) => {
    const { employee_id, date, time_in, time_out, status, total_hours, remarks } = req.body;
    if (!employee_id || !date || !time_in || !time_out || !status) {
        return res.status(400).json({ error: 'Missing required attendance fields.' });
    }
    const insertQuery = `
        INSERT INTO attendance (employee_id, date, time_in, time_out, status, total_hours, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        insertQuery,
        [employee_id, date, time_in, time_out, status, total_hours ?? null, remarks ?? null],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.sqlMessage || 'Failed to save attendance.' });
            }
            const statsQuery = `
                SELECT
                    SUM(CASE WHEN LOWER(status) = 'present' THEN 1 ELSE 0 END) AS total_present,
                    SUM(CASE WHEN LOWER(status) = 'late' THEN 1 ELSE 0 END) AS total_lates,
                    SUM(CASE WHEN LOWER(status) = 'absent' THEN 1 ELSE 0 END) AS total_absences
                FROM attendance
                WHERE employee_id = ?
                    AND MONTH(date) = MONTH(CURRENT_DATE())
                    AND YEAR(date) = YEAR(CURRENT_DATE())
            `;
            db.query(statsQuery, [employee_id], (statsErr, statsRows) => {
                if (statsErr) {
                    return res.status(500).json({ error: statsErr.sqlMessage || 'Attendance saved but failed to fetch statistics.' });
                }
                res.json({
                    id: result.insertId,
                    employee_id, date, time_in, time_out, status,
                    total_hours, remarks,
                    stats: statsRows[0] || { total_present: 0, total_lates: 0, total_absences: 0 }
                });
            });
        }
    );
});
app.get('/attendance/summary', (req, res) => {
    const { employee_id } = req.query;
    let { month, year } = req.query;
    if (!employee_id) { return res.status(400).json({ error: 'employee_id is required' }); }
    const now = new Date();
    month = parseInt(month, 10) || now.getMonth() + 1;
    year = parseInt(year, 10) || now.getFullYear();
    const summaryQuery = `
        SELECT
            SUM(CASE WHEN LOWER(status) = 'present' THEN 1 ELSE 0 END) AS total_present,
            SUM(CASE WHEN LOWER(status) = 'late' THEN 1 ELSE 0 END) AS total_lates,
            SUM(CASE WHEN LOWER(status) = 'absent' THEN 1 ELSE 0 END) AS total_absences
        FROM attendance
        WHERE employee_id = ?
            AND MONTH(date) = ?
            AND YEAR(date) = ?
    `;
    db.query(summaryQuery, [employee_id, month, year], (err, rows) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || 'Failed to fetch summary.' });
        res.json(rows[0] || { total_present: 0, total_lates: 0, total_absences: 0 });
    });
});
app.get('/attendance/monthly', (req, res) => {
    const { employee_id } = req.query;
    let { month, year } = req.query;
    if (!employee_id) { return res.status(400).json({ error: 'employee_id is required' }); }
    const now = new Date();
    month = parseInt(month, 10) || now.getMonth() + 1;
    year = parseInt(year, 10) || now.getFullYear();
    const recordsQuery = `
        SELECT id, employee_id, date, time_in, time_out, status, total_hours, remarks
        FROM attendance
        WHERE employee_id = ?
            AND MONTH(date) = ?
            AND YEAR(date) = ?
        ORDER BY date ASC
    `;
    db.query(recordsQuery, [employee_id, month, year], (err, rows) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || 'Failed to fetch attendance records.' });
        res.json(rows);
    });
});
app.get('/attendance/admin/stats', (req, res) => {
    const { whereClause, values } = buildAttendanceFilterClauses(req.query, true);
    const statsQuery = `
        SELECT
            SUM(CASE WHEN LOWER(a.status) = 'present' THEN 1 ELSE 0 END) AS total_present,
            SUM(CASE WHEN LOWER(a.status) = 'absent' THEN 1 ELSE 0 END) AS total_absent,
            SUM(CASE WHEN LOWER(a.status) = 'late' THEN 1 ELSE 0 END) AS total_lates,
            COUNT(*) AS total_logs
        FROM attendance a
        LEFT JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        ${whereClause}
    `;
    db.query(statsQuery, values, (err, rows) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || 'Failed to fetch admin stats.' });
        const stats = rows[0] || { total_present: 0, total_absent: 0, total_lates: 0, total_logs: 0 };
        const denominator = (stats.total_present || 0) + (stats.total_absent || 0) + (stats.total_lates || 0);
        const attendance_rate = denominator ? (stats.total_present / denominator) * 100 : 0;
        res.json({
            total_present: stats.total_present || 0,
            total_absent: stats.total_absent || 0,
            total_lates: stats.total_lates || 0,
            attendance_rate
        });
    });
});
app.get('/attendance/admin', (req, res) => {
    const { whereClause, values } = buildAttendanceFilterClauses(req.query, true);
    const limit = Math.min(parseInt(req.query.limit, 10) || 150, 500);
    const recordsQuery = `
        SELECT
            a.id,
            a.employee_id,
            TRIM(CONCAT(IFNULL(e.first_name, ''), ' ', IFNULL(e.last_name, ''))) AS employee_name,
            COALESCE(d.name, 'Unassigned') AS department_name,
            a.date,
            a.time_in,
            a.time_out,
            a.total_hours,
            a.status,
            a.remarks
        FROM attendance a
        LEFT JOIN employees e ON a.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        ${whereClause}
        ORDER BY a.date DESC, a.time_in DESC, a.id DESC
        LIMIT ?
    `;
    db.query(recordsQuery, [...values, limit], (err, rows) => {
        if (err) return res.status(500).json({ error: err.sqlMessage || 'Failed to fetch admin attendance records.' });
        res.json(rows);
    });
});
app.get('/attendance', (req, res) => {
    const clauses = [];
    const params = [];
    if (req.query.employee_id) { clauses.push('employee_id = ?'); params.push(req.query.employee_id); }
    if (req.query.start_date) { clauses.push('date >= ?'); params.push(req.query.start_date); }
    if (req.query.end_date) { clauses.push('date <= ?'); params.push(req.query.end_date); }
    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const query = `SELECT * FROM attendance ${whereClause} ORDER BY date DESC, time_in DESC, id DESC`;
    db.query(query, params, (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});
app.get('/attendance/:id', (req, res) => {
    db.query('SELECT * FROM attendance WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});
app.put('/attendance/:id', (req, res) => {
    const { employee_id, date, time_in, time_out, status } = req.body;
    db.query(
        'UPDATE attendance SET employee_id=?, date=?, time_in=?, time_out=?, status=? WHERE id=?',
        [employee_id, date, time_in, time_out, status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Attendance updated' });
        }
    );
});
app.delete('/attendance/:id', (req, res) => {
    db.query('DELETE FROM attendance WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Attendance deleted' });
    });
});

/* ------- THE REST OF YOUR MODULES (leave_requests, payroll, announcements, users, XML export, signup, login, etc.) ------- */
// ... (all copied from your server.js — keep them exactly, no changes)

/* ------- LOGIN, SIGNUP, AND EXPORT MODULES (unchanged) ------- */
// ... (all from your server.js)

/* ------- START SERVER ------- */
/* ------- LEAVE REQUESTS MODULE ------- */
// CREATE Leave Request (employee-side) - FIXED with proper status default
app.post('/api/leave-requests', (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    
    // Validate required fields
    if (!employee_id || !leave_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    db.query(
        'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, created_at) VALUES (?, ?, ?, ?, ?, "Pending", NOW())',
        [employee_id, leave_type, start_date, end_date, reason || ''],
        (err, result) => {
            if (err) {
                console.error('Error creating leave request:', err);
                return res.status(500).json({ error: err.sqlMessage || 'Failed to create leave request' });
            }
            console.log('Leave request created with ID:', result.insertId);
            res.json({ 
                id: result.insertId, 
                employee_id,
                leave_type,
                start_date,
                end_date,
                reason: reason || '',
                status: "Pending", 
                created_at: new Date() 
            });
        }
    );
});

// GET ALL Leave Requests (admin-side)
app.get('/api/leave-requests', (req, res) => {
    db.query('SELECT * FROM leave_requests ORDER BY created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching leave requests:', err);
            return res.status(500).json({ error: err });
        }
        res.json(results);
    });
});

// UPDATE STATUS ONLY (admin approve/decline) - FIXED with validation
app.put('/api/leave-requests/:id', (req, res) => {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Pending', 'Approved', 'Declined'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }
    
    db.query(
        'UPDATE leave_requests SET status=? WHERE id=?',
        [status, req.params.id],
        (err, result) => {
            if (err) {
                console.error('Error updating leave request status:', err);
                return res.status(500).json({ error: err });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Leave request not found' });
            }
            console.log(`Leave request ${req.params.id} status updated to: ${status}`);
            res.json({ message: 'Leave request status updated', status });
        }
    );
});

// GET by employee_id (employee-side)
app.get('/api/leave-requests/employee/:employee_id', (req, res) => {
    db.query(
        'SELECT * FROM leave_requests WHERE employee_id=? ORDER BY created_at DESC', 
        [req.params.employee_id], 
        (err, results) => {
            if (err) {
                console.error('Error fetching employee leave requests:', err);
                return res.status(500).json({ error: err });
            }
            res.json(results);
        }
    );
});

// GET Leave Balance by Employee ID (UPDATED - Only 2 days total, excludes Emergency & Maternity)
app.get('/api/leave-balance/:employee_id', (req, res) => {
    const employeeId = req.params.employee_id;
    
    // Total available leave days for Vacation and Sick Leave combined
    const TOTAL_LEAVE_DAYS = 2;
    
    // Query to get sum of approved leave days (EXCLUDING Emergency and Maternity Leave)
    const query = `
        SELECT 
            SUM(DATEDIFF(end_date, start_date) + 1) as used_days
        FROM leave_requests
        WHERE employee_id = ? 
        AND status = 'Approved'
        AND leave_type NOT LIKE '%Emergency%'
        AND leave_type NOT LIKE '%Maternity%'
    `;
    
    db.query(query, [employeeId], (err, results) => {
        if (err) {
            console.error('Error fetching leave balance:', err);
            return res.status(500).json({ error: err });
        }
        
        const usedDays = (results[0] && results[0].used_days) ? parseInt(results[0].used_days) : 0;
        const remainingDays = Math.max(0, TOTAL_LEAVE_DAYS - usedDays);
        
        const balance = {
            total: TOTAL_LEAVE_DAYS,
            used: usedDays,
            remaining: remainingDays
        };
        
        console.log('Leave balance calculated for employee:', employeeId, balance);
        res.json(balance);
    });
});

/* ------- EMPLOYEES MODULE ------- */
app.post('/employees', (req, res) => {
    const { first_name, last_name, email, department_id, position, date_hired, salary, password, status } = req.body;
    db.query(
        'INSERT INTO employees (first_name, last_name, email, department_id, position, date_hired, salary, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, department_id, position, date_hired, salary, password, status],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, ...req.body });
        }
    );
});

app.get('/employees', (req, res) => {
    db.query('SELECT * FROM employees', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.get('/employees/:id', (req, res) => {
    db.query('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

app.put('/employees/:id', (req, res) => {
    const { first_name, last_name, email, department_id, position, date_hired, salary, password, status } = req.body;
    db.query(
        'UPDATE employees SET first_name=?, last_name=?, email=?, department_id=?, position=?, date_hired=?, salary=?, password=?, status=? WHERE id=?',
        [first_name, last_name, email, department_id, position, date_hired, salary, password, status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Employee updated' });
        }
    );
});

app.delete('/employees/:id', (req, res) => {
    db.query('DELETE FROM employees WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Employee deleted' });
    });
});

// READ single department by ID
app.get('/departments/:id', (req, res) => {
    db.query('SELECT * FROM departments WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// UPDATE department by ID
app.put('/departments/:id', (req, res) => {
    const { name, description } = req.body;
    db.query(
        'UPDATE departments SET name=?, description=? WHERE id=?',
        [name, description, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Department updated' });
        }
    );
});

// DELETE department by ID
app.delete('/departments/:id', (req, res) => {
    db.query('DELETE FROM departments WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Department deleted' });
    });
});

// --- ATTENDANCE MODULE ---
app.post('/attendance', (req, res) => {
    const { employee_id, date, time_in, time_out, status } = req.body;
    db.query(
        'INSERT INTO attendance (employee_id, date, time_in, time_out, status) VALUES (?, ?, ?, ?, ?)',
        [employee_id, date, time_in, time_out, status],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, employee_id, date, time_in, time_out, status });
        }
    );
});

app.get('/attendance', (req, res) => {
    db.query('SELECT * FROM attendance', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.get('/attendance/:id', (req, res) => {
    db.query('SELECT * FROM attendance WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

app.put('/attendance/:id', (req, res) => {
    const { employee_id, date, time_in, time_out, status } = req.body;
    db.query(
        'UPDATE attendance SET employee_id=?, date=?, time_in=?, time_out=?, status=? WHERE id=?',
        [employee_id, date, time_in, time_out, status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Attendance updated' });
        }
    );
});

app.delete('/attendance/:id', (req, res) => {
    db.query('DELETE FROM attendance WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Attendance deleted' });
    });
});

// --- LEAVE REQUESTS MODULE (duplicate routes for compatibility) ---
app.post('/leave_requests', (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason, status } = req.body;
    db.query(
        'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
        [employee_id, leave_type, start_date, end_date, reason, status || 'Pending'],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, employee_id, leave_type, start_date, end_date, reason, status: status || 'Pending' });
        }
    );
});

app.get('/leave_requests', (req, res) => {
    db.query('SELECT * FROM leave_requests', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.get('/leave_requests/:id', (req, res) => {
    db.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

app.put('/leave_requests/:id', (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason, status } = req.body;
    db.query(
        'UPDATE leave_requests SET employee_id=?, leave_type=?, start_date=?, end_date=?, reason=?, status=? WHERE id=?',
        [employee_id, leave_type, start_date, end_date, reason, status, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Leave request updated' });
        }
    );
});

app.delete('/leave_requests/:id', (req, res) => {
    db.query('DELETE FROM leave_requests WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Leave request deleted' });
    });
});

// --- PAYROLL MODULE ---
app.post('/payroll', (req, res) => {
    const { employee_id, month, year, basic_salary, deductions, bonus, net_salary } = req.body;
    db.query(
        'INSERT INTO payroll (employee_id, month, year, basic_salary, deductions, bonus, net_salary) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [employee_id, month, year, basic_salary, deductions, bonus, net_salary],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, employee_id, month, year, basic_salary, deductions, bonus, net_salary });
        }
    );
});

app.get('/payroll', (req, res) => {
    db.query('SELECT * FROM payroll', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.get('/payroll/:id', (req, res) => {
    db.query('SELECT * FROM payroll WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

app.put('/payroll/:id', (req, res) => {
    const { employee_id, month, year, basic_salary, deductions, bonus, net_salary } = req.body;
    db.query(
        'UPDATE payroll SET employee_id=?, month=?, year=?, basic_salary=?, deductions=?, bonus=?, net_salary=? WHERE id=?',
        [employee_id, month, year, basic_salary, deductions, bonus, net_salary, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Payroll updated' });
        }
    );
});

app.delete('/payroll/:id', (req, res) => {
    db.query('DELETE FROM payroll WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Payroll deleted' });
    });
});

// --- ANNOUNCEMENTS MODULE ---
app.post('/announcements', (req, res) => {
    const { title, content, created_by } = req.body;
    db.query(
        'INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?)',
        [title, content, created_by],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, title, content, created_by });
        }
    );
});

app.get('/announcements', (req, res) => {
    db.query('SELECT * FROM announcements', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.get('/announcements/:id', (req, res) => {
    db.query('SELECT * FROM announcements WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

app.put('/announcements/:id', (req, res) => {
    const { title, content, created_by } = req.body;
    db.query(
        'UPDATE announcements SET title=?, content=?, created_by=? WHERE id=?',
        [title, content, created_by, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Announcement updated' });
        }
    );
});

app.delete('/announcements/:id', (req, res) => {
    db.query('DELETE FROM announcements WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Announcement deleted' });
    });
});

// --- USERS MODULE ---
app.post('/users', (req, res) => {
    console.log('REQ BODY:', req.body);  // For debugging
    // Destructure correctly
    const { username, password, role, employee_id, department_name } = req.body;
    db.query(
        'INSERT INTO users (username, password, role, employee_id, department_name) VALUES (?, ?, ?, ?, ?)',
        [username, password, role, employee_id, department_name],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, username, role, employee_id, department_name });
        }
    );
});

app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

app.get('/users/:id', (req, res) => {
    db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

app.put('/users/:id', (req, res) => {
    const { username, password, role, employee_id } = req.body;
    db.query(
        'UPDATE users SET username=?, password=?, role=?, employee_id=? WHERE id=?',
        [username, password, role, employee_id, req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'User updated' });
        }
    );
});

app.delete('/users/:id', (req, res) => {
    db.query('DELETE FROM users WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'User deleted' });
    });
});

// --- XML EXPORT ROUTES ---
app.get('/export/employees/xml', (req, res) => {
    db.query('SELECT * FROM employees', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const xml = convert.json2xml({ employees: { employee: results } }, { compact: true, spaces: 4 });
        res.header('Content-Type', 'application/xml');
        res.header('Content-Disposition', 'attachment; filename=employees.xml');
        res.send(xml);
    });
});

app.get('/export/departments/xml', (req, res) => {
    db.query('SELECT * FROM departments', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const xml = convert.json2xml({ departments: { department: results } }, { compact: true, spaces: 4 });
        res.header('Content-Type', 'application/xml');
        res.header('Content-Disposition', 'attachment; filename=departments.xml');
        res.send(xml);
    });
});

app.get('/export/attendance/xml', (req, res) => {
    db.query('SELECT * FROM attendance', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const xml = convert.json2xml({ attendanceList: { attendance: results } }, { compact: true, spaces: 4 });
        res.header('Content-Type', 'application/xml');
        res.header('Content-Disposition', 'attachment; filename=attendance.xml');
        res.send(xml);
    });
});

app.get('/export/leave_requests/xml', (req, res) => {
    db.query('SELECT * FROM leave_requests', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const xml = convert.json2xml({ leaveRequests: { leave: results } }, { compact: true, spaces: 4 });
        res.header('Content-Type', 'application/xml');
        res.header('Content-Disposition', 'attachment; filename=leave_requests.xml');
        res.send(xml);
    });
});

app.get('/export/payroll/xml', (req, res) => {
    db.query('SELECT * FROM payroll', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const xml = convert.json2xml({ payrolls: { payroll: results } }, { compact: true, spaces: 4 });
        res.header('Content-Type', 'application/xml');
        res.header('Content-Disposition', 'attachment; filename=payroll.xml');
        res.send(xml);
    });
});

app.get('/export/announcements/xml', (req, res) => {
    db.query('SELECT * FROM announcements', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const xml = convert.json2xml({ announcements: { announcement: results } }, { compact: true, spaces: 4 });
        res.header('Content-Type', 'application/xml');
        res.header('Content-Disposition', 'attachment; filename=announcements.xml');
        res.send(xml);
    });
});

app.get('/export/users/xml', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        const xml = convert.json2xml({ users: { user: results } }, { compact: true, spaces: 4 });
        res.header('Content-Type', 'application/xml');
        res.header('Content-Disposition', 'attachment; filename=users.xml');
        res.send(xml);
    });
});

// --- SIGNUP ROUTE (case-insensitive for "Employee") ---
app.post('/signup', (req, res) => {
    const { first_name, last_name, email, password, account_type, department_id, department_name } = req.body;
    console.log('Signup request received:', { first_name, last_name, email, account_type, department_id, department_name });

    const type = (account_type || '').toLowerCase();

    // Auto-create department if missing -- THIS BLOCK IS NEW
    if (department_name && department_name.trim() !== '') {
        db.query(
            'INSERT IGNORE INTO departments (name, created_at) VALUES (?, NOW())',
            [department_name],
            (err) => {
                if (err) {
                    console.error('Error creating department:', err);
                    // Don't block signup; just log and continue
                }
                continueSignup();
            }
        );
    } else {
        continueSignup();
    }

    // All signup logic is moved to a function so we can call after attempting to insert department
    function continueSignup() {
        if (account_type === 'HR/Admin') {
            db.query(
                'INSERT INTO users (username, password, role, employee_id) VALUES (?, ?, ?, NULL)',
                [email, password, account_type],
                (err, result) => {
                    if (err) {
                        console.error('Error creating HR/Admin user:', err);
                        return res.status(500).json({ success: false, error: err.sqlMessage || 'Failed to create account' });
                    }
                    console.log('HR/Admin user created successfully with ID:', result.insertId);
                    res.json({ 
                        success: true, 
                        message: 'HR/Admin account created successfully!',
                        user_id: result.insertId,
                        role: account_type
                    });
                }
            );
        }
        else if (type === 'employee') {
            db.query(
                'INSERT INTO employees (first_name, last_name, email, password, department_id, position, status, date_hired) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
                [first_name, last_name, email, password, department_id || null, 'New Employee', 'Active'],
                (err, result) => {
                    if (err) {
                        console.error('Error creating employee:', err);
                        return res.status(500).json({ success: false, error: err.sqlMessage || 'Failed to create account' });
                    }
                    const employee_id = result.insertId;
                    console.log('Employee created with ID:', employee_id);

                    db.query(
                        'INSERT INTO users (username, password, role, employee_id, department_name) VALUES (?, ?, ?, ?, ?)',
                        [email, password, 'employee', employee_id, department_name],
                        (err2, result2) => {
                            if (err2) {
                                console.error('Error creating user:', err2);
                                return res.status(500).json({ success: false, error: err2.sqlMessage || 'Failed to create user account' });
                            }

                            console.log('User created successfully with role: employee');
                            res.json({ 
                                success: true, 
                                message: 'Employee account created successfully!',
                                employee_id: employee_id,
                                user_id: result2.insertId,
                                role: 'employee'
                            });
                        }
                    );
                }
            );
        }
        else {
            res.status(400).json({ success: false, error: 'Invalid account type' });
        }
    }
});


// --- LOGIN ROUTE ---
app.post('/api/login', (req, res) => {
    const { identifier, password } = req.body;
    console.log('Login attempt:', { identifier, password: '***' });
    db.query(
        'SELECT * FROM users WHERE username=? AND password=?',
        [identifier, password],
        (err, results) => {
            if (err) {
                console.error('Login error:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            if (results.length === 0) {
                console.log('No user found with credentials');
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const user = results[0];
            console.log('User found:', { id: user.id, username: user.username, role: user.role });
            res.json({
                id: user.id,
                employee_id: user.employee_id,
                username: user.username,
                role: user.role
            });
        }
    );
});
app.post('/users', (req, res) => {
    console.log('REQ BODY:', req.body);
    const { username, password, role, employee_id, department_name } = req.body;
    db.query(
        'INSERT INTO users (username, password, role, employee_id, department_name) VALUES (?, ?, ?, ?, ?)',
        [username, password, role, employee_id, department_name],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, username, role, employee_id, department_name });
        }
    );
});

// START SERVER (always last)
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
