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
    database: 'worknest_db'
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

// --- EMPLOYEES MODULE ---
// CREATE new employee
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

// READ all employees
app.get('/employees', (req, res) => {
    db.query('SELECT * FROM employees', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// READ a single employee by ID
app.get('/employees/:id', (req, res) => {
    db.query('SELECT * FROM employees WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// UPDATE employee by ID
app.put('/employees/:id', (req, res) => {
    const { first_name, last_name, email, department_id, position, date_hired, salary, password, status } = req.body;
db.query(
  'INSERT INTO employees (first_name, last_name, email, department_id, position, date_hired, salary, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  [first_name, last_name, email, department_id, position, date_hired, salary, password, status],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: 'Employee updated' });
        }
    );
});

// DELETE employee by ID
app.delete('/employees/:id', (req, res) => {
    db.query('DELETE FROM employees WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Employee deleted' });
    });
});

// --- DEPARTMENTS MODULE ---
// CREATE new department
app.post('/departments', (req, res) => {
    const { name, description } = req.body;
    db.query(
        'INSERT INTO departments (name, description) VALUES (?, ?)',
        [name, description],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, name, description });
        }
    );
});

// READ all departments
app.get('/departments', (req, res) => {
    db.query('SELECT * FROM departments', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
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
// CREATE new attendance record
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

// READ all attendance records
app.get('/attendance', (req, res) => {
    db.query('SELECT * FROM attendance', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// READ single attendance record by ID
app.get('/attendance/:id', (req, res) => {
    db.query('SELECT * FROM attendance WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// UPDATE attendance record by ID
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

// DELETE attendance record by ID
app.delete('/attendance/:id', (req, res) => {
    db.query('DELETE FROM attendance WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Attendance deleted' });
    });
});

// --- LEAVE REQUESTS MODULE ---
app.post('/leave_requests', (req, res) => {
    const { employee_id, leave_type, start_date, end_date, reason, status } = req.body;
    db.query(
        'INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
        [employee_id, leave_type, start_date, end_date, reason, status],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, employee_id, leave_type, start_date, end_date, reason, status });
        }
    );
});

// READ all leave requests
app.get('/leave_requests', (req, res) => {
    db.query('SELECT * FROM leave_requests', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// READ single leave request by ID
app.get('/leave_requests/:id', (req, res) => {
    db.query('SELECT * FROM leave_requests WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// UPDATE leave request by ID
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

// DELETE leave request by ID
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

// READ all payroll records
app.get('/payroll', (req, res) => {
    db.query('SELECT * FROM payroll', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// READ single payroll record by ID
app.get('/payroll/:id', (req, res) => {
    db.query('SELECT * FROM payroll WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// UPDATE payroll record by ID
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

// DELETE payroll record by ID
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

// READ all announcements
app.get('/announcements', (req, res) => {
    db.query('SELECT * FROM announcements', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// READ single announcement by ID
app.get('/announcements/:id', (req, res) => {
    db.query('SELECT * FROM announcements WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// UPDATE announcement by ID
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

// DELETE announcement by ID
app.delete('/announcements/:id', (req, res) => {
    db.query('DELETE FROM announcements WHERE id=?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ message: 'Announcement deleted' });
    });
});

// --- USERS MODULE ---
app.post('/users', (req, res) => {
    const { username, password, role, employee_id } = req.body;
    db.query(
        'INSERT INTO users (username, password, role, employee_id) VALUES (?, ?, ?, ?)',
        [username, password, role, employee_id],
        (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ id: result.insertId, username, role, employee_id });
        }
    );
});

// READ all users
app.get('/users', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// READ single user by ID
app.get('/users/:id', (req, res) => {
    db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(results[0]);
    });
});

// UPDATE user by ID
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

// DELETE user by ID
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

// START SERVER (always last)
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
// --- SIGNUP ROUTE ---
app.post('/signup', (req, res) => {
    const { first_name, last_name, email, password, account_type, department_id } = req.body;
    
    // Insert into employees table
    db.query(
        'INSERT INTO employees (first_name, last_name, email, password, department_id, position, status, date_hired) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
        [first_name, last_name, email, password, department_id || null, 'New Employee', 'Active'],
        (err, result) => {
            if (err) {
                console.error('Error creating employee:', err);
                return res.status(500).json({ success: false, error: 'Failed to create account' });
            }
            
            const employee_id = result.insertId;
            
            // Insert into users table
            db.query(
                'INSERT INTO users (username, password, role, employee_id) VALUES (?, ?, ?, ?)',
                [email, password, account_type, employee_id],
                (err2, result2) => {
                    if (err2) {
                        console.error('Error creating user:', err2);
                        return res.status(500).json({ success: false, error: 'Failed to create user account' });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: 'Account created successfully!',
                        employee_id: employee_id,
                        role: account_type
                    });
                }
            );
        }
    );
});
