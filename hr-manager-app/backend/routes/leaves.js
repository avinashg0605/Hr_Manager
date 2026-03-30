const express = require('express');
const db = require('../database');
const router = express.Router();

// Get all leaves with employee details
router.get('/', async (req, res) => {
    try {
        const [leaves] = await db.query(
            `SELECT l.*, CONCAT(e.first_name, ' ', e.last_name) as full_name, e.email 
             FROM leaves l 
             LEFT JOIN employees e ON l.employee_id = e.id 
             ORDER BY l.created_at DESC`
        );
        res.json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

// Get leaves for specific employee
router.get('/employee/:employeeId', async (req, res) => {
    try {
        const [leaves] = await db.query(
            `SELECT * FROM leaves WHERE employee_id = ? ORDER BY created_at DESC`,
            [req.params.employeeId]
        );
        res.json(leaves);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch leaves' });
    }
});

// Create leave request
router.post('/', async (req, res) => {
    try {
        const { employee_id, leave_type, start_date, end_date, reason, status } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO leaves 
            (employee_id, leave_type, start_date, end_date, reason, status) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [employee_id, leave_type, start_date, end_date, reason, status || 'pending']
        );
        
        res.status(201).json({ message: 'Leave request created', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create leave request' });
    }
});

// Update leave status
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        
        const [result] = await db.query(
            'UPDATE leaves SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Leave request not found' });
        }
        
        res.json({ message: 'Leave request updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update leave request' });
    }
});

// Delete leave request
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM leaves WHERE id = ?',
            [req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Leave request not found' });
        }
        
        res.json({ message: 'Leave request deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete leave request' });
    }
});

module.exports = router;