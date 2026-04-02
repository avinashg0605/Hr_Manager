const Employee = require('../models/Employee');
const { validationResult } = require('express-validator');

// Get all employees
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.getAll();
        res.json({
            success: true,
            data: employees,
            count: employees.length,
            message: 'Employees retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getAllEmployees:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employees',
            error: error.message
        });
    }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.getById(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        res.json({
            success: true,
            data: employee,
            message: 'Employee retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getEmployeeById:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employee',
            error: error.message
        });
    }
};

// Create new employee
exports.createEmployee = async (req, res) => {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const employee = await Employee.create(req.body);
        res.status(201).json({
            success: true,
            data: employee,
            message: 'Employee created successfully'
        });
    } catch (error) {
        console.error('Error in createEmployee:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Employee with this email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating employee',
            error: error.message
        });
    }
};

// Update employee
exports.updateEmployee = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const employee = await Employee.update(req.params.id, req.body);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        res.json({
            success: true,
            data: employee,
            message: 'Employee updated successfully'
        });
    } catch (error) {
        console.error('Error in updateEmployee:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Employee with this email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating employee',
            error: error.message
        });
    }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
    try {
        const deleted = await Employee.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Error in deleteEmployee:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting employee',
            error: error.message
        });
    }
};

// Get employees by department
exports.getEmployeesByDepartment = async (req, res) => {
    try {
        const employees = await Employee.getByDepartment(req.params.department);
        res.json({
            success: true,
            data: employees,
            count: employees.length,
            message: 'Employees retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getEmployeesByDepartment:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employees',
            error: error.message
        });
    }
};

// Get all departments
exports.getDepartments = async (req, res) => {
    try {
        const departments = await Employee.getDepartments();
        res.json({
            success: true,
            data: departments,
            message: 'Departments retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getDepartments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments',
            error: error.message
        });
    }
};

// Get statistics
exports.getStatistics = async (req, res) => {
    try {
        const stats = await Employee.getStatistics();
        res.json({
            success: true,
            data: stats,
            message: 'Statistics retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getStatistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// Search employees
exports.searchEmployees = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        const employees = await Employee.search(q);
        res.json({
            success: true,
            data: employees,
            count: employees.length,
            message: 'Search completed successfully'
        });
    } catch (error) {
        console.error('Error in searchEmployees:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching employees',
            error: error.message
        });
    }
};