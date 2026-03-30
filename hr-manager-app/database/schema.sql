-- Create database
CREATE DATABASE IF NOT EXISTS hr_manager;
USE hr_manager;

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    photo VARCHAR(255),
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Leaves table
CREATE TABLE IF NOT EXISTS leaves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type ENUM('sick', 'vacation', 'personal', 'other') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    basic_salary DECIMAL(10, 2) NOT NULL,
    allowances DECIMAL(10, 2) DEFAULT 0,
    deductions DECIMAL(10, 2) DEFAULT 0,
    net_salary DECIMAL(10, 2) NOT NULL,
    payment_date DATE,
    status ENUM('pending', 'paid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY unique_payroll (employee_id, month, year)
);

-- Insert sample users (password: 'password123' - bcrypt hash)
-- Note: These are bcrypt hashes of 'password123'. You can create users via registration form.
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@hrmanager.com', '$2b$10$YOUR_HASH_HERE', 'admin'),
('john.doe', 'john.doe@company.com', '$2b$10$YOUR_HASH_HERE', 'employee');

-- Insert sample employees
INSERT INTO employees (user_id, first_name, last_name, email, phone, position, department, hire_date, salary, status) VALUES
(2, 'John', 'Doe', 'john.doe@company.com', '+1234567890', 'Software Engineer', 'IT', '2023-01-15', 60000.00, 'active'),
(NULL, 'Jane', 'Smith', 'jane.smith@company.com', '+1234567891', 'HR Specialist', 'Human Resources', '2023-02-20', 55000.00, 'active'),
(NULL, 'Bob', 'Johnson', 'bob.johnson@company.com', '+1234567892', 'Product Manager', 'Product', '2023-03-10', 75000.00, 'active'),
(NULL, 'Alice', 'Williams', 'alice.williams@company.com', '+1234567893', 'UX Designer', 'Design', '2023-04-05', 58000.00, 'active'),
(NULL, 'Charlie', 'Brown', 'charlie.brown@company.com', '+1234567894', 'Sales Rep', 'Sales', '2023-05-12', 52000.00, 'inactive');

-- Insert sample leaves
INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status) VALUES
(1, 'vacation', '2024-03-01', '2024-03-05', 'Family vacation', 'approved'),
(1, 'sick', '2024-02-10', '2024-02-11', 'Flu', 'approved'),
(2, 'personal', '2024-03-15', '2024-03-15', 'Personal appointment', 'pending'),
(3, 'vacation', '2024-04-01', '2024-04-07', 'Spring break', 'pending'),
(4, 'sick', '2024-02-20', '2024-02-22', 'Medical leave', 'approved');

-- Insert sample payroll
INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_date, status) VALUES
(1, 1, 2024, 60000.00, 5000.00, 2000.00, 63000.00, '2024-01-31', 'paid'),
(2, 1, 2024, 55000.00, 4000.00, 1500.00, 57500.00, '2024-01-31', 'paid'),
(3, 1, 2024, 75000.00, 6000.00, 2500.00, 78500.00, '2024-01-31', 'paid'),
(1, 2, 2024, 60000.00, 5000.00, 2000.00, 63000.00, '2024-02-29', 'paid'),
(2, 2, 2024, 55000.00, 4000.00, 1500.00, 57500.00, NULL, 'pending');