const { pool } = require('../config/database');

class Employee {
    // Get all employees
    static async getAll() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM employees ORDER BY created_at DESC'
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get employee by ID
    static async getById(id) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM employees WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Create new employee
    static async create(employeeData) {
        const { name, position, department, salary, email, phone, join_date } = employeeData;
        try {
            const [result] = await pool.query(
                `INSERT INTO employees (name, position, department, salary, email, phone, join_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [name, position, department, salary, email, phone, join_date]
            );
            return this.getById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // Update employee
    static async update(id, employeeData) {
        const { name, position, department, salary, email, phone, join_date, status } = employeeData;
        try {
            await pool.query(
                `UPDATE employees 
                 SET name = ?, position = ?, department = ?, salary = ?, 
                     email = ?, phone = ?, join_date = ?, status = ?
                 WHERE id = ?`,
                [name, position, department, salary, email, phone, join_date, status, id]
            );
            return this.getById(id);
        } catch (error) {
            throw error;
        }
    }

    // Delete employee
    static async delete(id) {
        try {
            const [result] = await pool.query(
                'DELETE FROM employees WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Get employees by department
    static async getByDepartment(department) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM employees WHERE department = ? ORDER BY name',
                [department]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Get all departments
    static async getDepartments() {
        try {
            const [rows] = await pool.query(
                'SELECT DISTINCT department FROM employees ORDER BY department'
            );
            return rows.map(row => row.department);
        } catch (error) {
            throw error;
        }
    }

    // Get statistics
    static async getStatistics() {
        try {
            const [stats] = await pool.query(`
                SELECT 
                    COUNT(*) as totalEmployees,
                    SUM(salary) as totalSalary,
                    AVG(salary) as avgSalary,
                    COUNT(DISTINCT department) as totalDepartments
                FROM employees
                WHERE status = 'active'
            `);
            
            const [deptStats] = await pool.query(`
                SELECT 
                    department,
                    COUNT(*) as count,
                    SUM(salary) as totalSalary,
                    AVG(salary) as avgSalary
                FROM employees
                WHERE status = 'active'
                GROUP BY department
            `);
            
            return {
                totalEmployees: stats[0].totalEmployees || 0,
                totalSalary: stats[0].totalSalary || 0,
                avgSalary: Math.round(stats[0].avgSalary || 0),
                totalDepartments: stats[0].totalDepartments || 0,
                departmentStats: deptStats
            };
        } catch (error) {
            throw error;
        }
    }

    // Search employees
    static async search(searchTerm) {
        try {
            const [rows] = await pool.query(
                `SELECT * FROM employees 
                 WHERE name LIKE ? 
                    OR position LIKE ? 
                    OR department LIKE ? 
                    OR email LIKE ?
                 ORDER BY name`,
                [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
            );
            return rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Employee;