const express = require('express');
const db = require('../database');
const router = express.Router();

// Get all payroll records with employee details
router.get('/', async (req, res) => {
    try {
        const [payroll] = await db.query(
            `SELECT p.*, CONCAT(e.first_name, ' ', e.last_name) as full_name, e.email, e.position 
             FROM payroll p 
             LEFT JOIN employees e ON p.employee_id = e.id 
             ORDER BY p.year DESC, p.month DESC`
        );
        res.json(payroll);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch payroll records' });
    }
});

// Get payroll for specific employee
router.get('/employee/:employeeId', async (req, res) => {
    try {
        const [payroll] = await db.query(
            `SELECT * FROM payroll WHERE employee_id = ? ORDER BY year DESC, month DESC`,
            [req.params.employeeId]
        );
        res.json(payroll);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch payroll records' });
    }
});

// Create payroll record
router.post('/', async (req, res) => {
    try {
        const { employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_date, status } = req.body;
        
        // Check if record already exists
        const [existing] = await db.query(
            'SELECT id FROM payroll WHERE employee_id = ? AND month = ? AND year = ?',
            [employee_id, month, year]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Payroll record already exists for this employee/month/year' });
        }
        
        const [result] = await db.query(
            `INSERT INTO payroll 
            (employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_date, status || 'pending']
        );
        
        res.status(201).json({ message: 'Payroll record created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create payroll record' });
    }
});

// Update payroll record
router.put('/:id', async (req, res) => {
    try {
        const { basic_salary, allowances, deductions, net_salary, payment_date, status } = req.body;
        
        const [result] = await db.query(
            `UPDATE payroll SET 
            basic_salary = ?, allowances = ?, deductions = ?, 
            net_salary = ?, payment_date = ?, status = ?
            WHERE id = ?`,
            [basic_salary, allowances, deductions, net_salary, payment_date, status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }
        
        res.json({ message: 'Payroll record updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update payroll record' });
    }
});

// Delete payroll record
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM payroll WHERE id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Payroll record not found' });
        }
        
        res.json({ message: 'Payroll record deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete payroll record' });
    }
});

// Generate payroll for all employees for a specific month
router.post('/generate', async (req, res) => {
    try {
        const { month, year } = req.body;
        
        // Get all active employees
        const [employees] = await db.query(
            'SELECT id, salary FROM employees WHERE status = "active"'
        );
        
        let created = 0;
        let skipped = 0;
        
        for (const employee of employees) {
            // Check if payroll already exists for this employee/month/year
            const [existing] = await db.query(
                'SELECT id FROM payroll WHERE employee_id = ? AND month = ? AND year = ?',
                [employee.id, month, year]
            );
            
            if (existing.length === 0) {
                const net_salary = parseFloat(employee.salary);
                await db.query(
                    `INSERT INTO payroll 
                    (employee_id, month, year, basic_salary, allowances, deductions, net_salary, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [employee.id, month, year, employee.salary, 0, 0, net_salary, 'pending']
                );
                created++;
            } else {
                skipped++;
            }
        }
        
        res.json({ 
            message: `Payroll generated: ${created} created, ${skipped} skipped`,
            created,
            skipped
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate payroll' });
    }
});

module.exports = router;