-- Create database
CREATE DATABASE IF NOT EXISTS employee_management;
USE employee_management;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    join_date DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO employees (name, position, department, salary, email, phone, join_date) VALUES
('Alexander Mitchell', 'Chief Executive Officer', 'Executive', 250000, 'alex.mitchell@company.com', '+1 (555) 123-4567', '2022-01-15'),
('Victoria Chen', 'CTO', 'Technology', 185000, 'victoria.chen@company.com', '+1 (555) 234-5678', '2022-03-20'),
('Michael Rodriguez', 'Lead Developer', 'Technology', 120000, 'michael.rodriguez@company.com', '+1 (555) 345-6789', '2022-06-10'),
('Emma Watson', 'HR Director', 'Human Resources', 110000, 'emma.watson@company.com', '+1 (555) 456-7890', '2022-02-05'),
('James Wilson', 'Sales Manager', 'Sales', 130000, 'james.wilson@company.com', '+1 (555) 567-8901', '2022-04-18'),
('Sophia Lee', 'Product Manager', 'Product', 115000, 'sophia.lee@company.com', '+1 (555) 678-9012', '2022-07-22'),
('Daniel Brown', 'Senior Developer', 'Technology', 95000, 'daniel.brown@company.com', '+1 (555) 789-0123', '2023-01-10'),
('Olivia Martinez', 'Marketing Lead', 'Marketing', 90000, 'olivia.martinez@company.com', '+1 (555) 890-1234', '2023-02-14'),
('William Taylor', 'Financial Analyst', 'Finance', 85000, 'william.taylor@company.com', '+1 (555) 901-2345', '2023-03-01'),
('Isabella Garcia', 'UI/UX Designer', 'Technology', 78000, 'isabella.garcia@company.com', '+1 (555) 012-3456', '2023-04-05');

-- Create indexes for better performance
CREATE INDEX idx_email ON employees(email);
CREATE INDEX idx_department ON employees(department);
CREATE INDEX idx_status ON employees(status);