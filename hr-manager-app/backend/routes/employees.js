const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database');
const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage }).single('photo');

// Get all employees
router.get('/', async (req, res) => {
    try {
        const [employees] = await db.query(
            'SELECT id, user_id, first_name, last_name, email, phone, photo, position, department, hire_date, salary, status, created_at FROM employees ORDER BY created_at DESC'
        );
        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Get single employee
router.get('/:id', async (req, res) => {
    try {
        const [employees] = await db.query(
            'SELECT * FROM employees WHERE id = ?',
            [req.params.id]
        );
        
        if (employees.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json(employees[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// Create employee
router.post('/', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        try {
            const { first_name, last_name, email, phone, position, department, hire_date, salary, status } = req.body;
            const photo = req.file ? req.file.filename : null;
            
            const [result] = await db.query(
                `INSERT INTO employees 
                (first_name, last_name, email, phone, photo, position, department, hire_date, salary, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [first_name, last_name, email, phone, photo, position, department, hire_date, salary, status || 'active']
            );
            
            res.status(201).json({ message: 'Employee created', id: result.insertId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create employee' });
        }
    });
});

// Update employee
router.put('/:id', (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        try {
            const { first_name, last_name, email, phone, position, department, hire_date, salary, status } = req.body;
            const photo = req.file ? req.file.filename : undefined;
            
            let query = `UPDATE employees SET 
                first_name = ?, last_name = ?, email = ?, phone = ?, 
                position = ?, department = ?, hire_date = ?, salary = ?, status = ?`;
            let params = [first_name, last_name, email, phone, position, department, hire_date, salary, status];
            
            if (photo !== undefined) {
                query += ', photo = ?';
                params.push(photo);
            }
            
            query += ' WHERE id = ?';
            params.push(req.params.id);
            
            const [result] = await db.query(query, params);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Employee not found' });
            }
            
            res.json({ message: 'Employee updated' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update employee' });
        }
    });
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM employees WHERE id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json({ message: 'Employee deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

module.exports = router;