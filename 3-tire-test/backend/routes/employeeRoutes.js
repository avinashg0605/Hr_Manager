const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const employeeController = require('../controllers/employeeController');

// Validation rules
const employeeValidation = [
    body('name').notEmpty().withMessage('Name is required').trim(),
    body('position').notEmpty().withMessage('Position is required').trim(),
    body('department').notEmpty().withMessage('Department is required').trim(),
    body('salary').isNumeric().withMessage('Salary must be a number').isFloat({ min: 0 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('phone').optional().trim(),
    body('join_date').optional().isDate().withMessage('Invalid date format')
];

// Routes
router.get('/', employeeController.getAllEmployees);
router.get('/search', employeeController.searchEmployees);
router.get('/departments', employeeController.getDepartments);
router.get('/stats', employeeController.getStatistics);
router.get('/department/:department', employeeController.getEmployeesByDepartment);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', employeeValidation, employeeController.createEmployee);
router.put('/:id', employeeValidation, employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;