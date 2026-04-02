const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Path to JSON data file
const dataFilePath = path.join(__dirname, 'data', 'employees.json');

// Helper function to read data from JSON file
function readData() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return { employees: [], nextId: 1 };
    }
}

// Helper function to write data to JSON file
function writeData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
}

// ============= API ROUTES =============

// Get all employees
app.get('/api/employees', (req, res) => {
    try {
        const data = readData();
        res.json({
            success: true,
            data: data.employees,
            count: data.employees.length
        });
    } catch (error) {
        console.error('Error in GET /api/employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error reading employees data',
            error: error.message
        });
    }
});

// Get single employee by ID
app.get('/api/employees/:id', (req, res) => {
    try {
        const data = readData();
        const id = parseInt(req.params.id);
        const employee = data.employees.find(emp => emp.id === id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        console.error('Error in GET /api/employees/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employee',
            error: error.message
        });
    }
});

// Add new employee
app.post('/api/employees', (req, res) => {
    try {
        const data = readData();
        const { name, position, department, salary, email, phone, joinDate } = req.body;
        
        // Validation
        if (!name || !position || !department || !salary || !email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, position, department, salary, email'
            });
        }
        
        // Check for duplicate email
        const existingEmployee = data.employees.find(emp => emp.email === email);
        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: 'Employee with this email already exists'
            });
        }
        
        // Create new employee
        const newEmployee = {
            id: data.nextId++,
            name: name,
            position: position,
            department: department,
            salary: parseFloat(salary),
            email: email,
            phone: phone || '',
            joinDate: joinDate || new Date().toISOString().split('T')[0],
            status: 'active'
        };
        
        data.employees.push(newEmployee);
        writeData(data);
        
        res.status(201).json({
            success: true,
            data: newEmployee,
            message: 'Employee added successfully'
        });
    } catch (error) {
        console.error('Error in POST /api/employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding employee',
            error: error.message
        });
    }
});

// Update employee
app.put('/api/employees/:id', (req, res) => {
    try {
        const data = readData();
        const id = parseInt(req.params.id);
        const employeeIndex = data.employees.findIndex(emp => emp.id === id);
        
        if (employeeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        const { name, position, department, salary, email, phone, joinDate, status } = req.body;
        
        // Check for duplicate email (excluding current employee)
        if (email && email !== data.employees[employeeIndex].email) {
            const existingEmployee = data.employees.find(emp => emp.email === email);
            if (existingEmployee) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee with this email already exists'
                });
            }
        }
        
        // Update employee
        data.employees[employeeIndex] = {
            ...data.employees[employeeIndex],
            name: name || data.employees[employeeIndex].name,
            position: position || data.employees[employeeIndex].position,
            department: department || data.employees[employeeIndex].department,
            salary: salary ? parseFloat(salary) : data.employees[employeeIndex].salary,
            email: email || data.employees[employeeIndex].email,
            phone: phone || data.employees[employeeIndex].phone,
            joinDate: joinDate || data.employees[employeeIndex].joinDate,
            status: status || data.employees[employeeIndex].status
        };
        
        writeData(data);
        
        res.json({
            success: true,
            data: data.employees[employeeIndex],
            message: 'Employee updated successfully'
        });
    } catch (error) {
        console.error('Error in PUT /api/employees/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating employee',
            error: error.message
        });
    }
});

// Delete employee
app.delete('/api/employees/:id', (req, res) => {
    try {
        const data = readData();
        const id = parseInt(req.params.id);
        const employeeIndex = data.employees.findIndex(emp => emp.id === id);
        
        if (employeeIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        // Remove employee
        data.employees.splice(employeeIndex, 1);
        writeData(data);
        
        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Error in DELETE /api/employees/:id:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting employee',
            error: error.message
        });
    }
});

// Get employees by department
app.get('/api/departments/:dept/employees', (req, res) => {
    try {
        const data = readData();
        const department = req.params.dept;
        const filteredEmployees = data.employees.filter(
            emp => emp.department.toLowerCase() === department.toLowerCase()
        );
        
        res.json({
            success: true,
            data: filteredEmployees,
            count: filteredEmployees.length
        });
    } catch (error) {
        console.error('Error in GET /api/departments/:dept/employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employees by department',
            error: error.message
        });
    }
});

// Get all departments
app.get('/api/departments', (req, res) => {
    try {
        const data = readData();
        const departments = [...new Set(data.employees.map(emp => emp.department))];
        
        res.json({
            success: true,
            data: departments
        });
    } catch (error) {
        console.error('Error in GET /api/departments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching departments',
            error: error.message
        });
    }
});

// Get statistics
app.get('/api/stats', (req, res) => {
    try {
        const data = readData();
        const totalEmployees = data.employees.length;
        const totalSalary = data.employees.reduce((sum, emp) => sum + emp.salary, 0);
        const avgSalary = totalEmployees > 0 ? totalSalary / totalEmployees : 0;
        
        const departmentStats = {};
        data.employees.forEach(emp => {
            if (!departmentStats[emp.department]) {
                departmentStats[emp.department] = {
                    count: 0,
                    totalSalary: 0
                };
            }
            departmentStats[emp.department].count++;
            departmentStats[emp.department].totalSalary += emp.salary;
        });
        
        res.json({
            success: true,
            data: {
                totalEmployees,
                totalSalary,
                avgSalary: Math.round(avgSalary),
                departmentStats
            }
        });
    } catch (error) {
        console.error('Error in GET /api/stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        dataFile: dataFilePath
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📁 Data file: ${dataFilePath}`);
    console.log(`\n📊 Available endpoints:`);
    console.log(`   GET    http://localhost:${PORT}/api/health - Health check`);
    console.log(`   GET    http://localhost:${PORT}/api/employees - Get all employees`);
    console.log(`   GET    http://localhost:${PORT}/api/employees/:id - Get single employee`);
    console.log(`   POST   http://localhost:${PORT}/api/employees - Add new employee`);
    console.log(`   PUT    http://localhost:${PORT}/api/employees/:id - Update employee`);
    console.log(`   DELETE http://localhost:${PORT}/api/employees/:id - Delete employee`);
    console.log(`   GET    http://localhost:${PORT}/api/departments - Get all departments`);
    console.log(`   GET    http://localhost:${PORT}/api/stats - Get statistics`);
    console.log(`\n✅ Server ready!\n`);
});