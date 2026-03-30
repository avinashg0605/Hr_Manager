sudo dnf update -y
sudo dnf install mariadb105-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo mysql_secure_installation
mysql -u root -p
dnf module list nodejs
sudo dnf install nodejs -y
node -v
npm -v
sudo dnf install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
systemctl status nginx
sudo vi /etc/nginx/conf.d/hr_manager.conf
server {
    listen 80;
        root /usr/share/nginx/html/hr_manager_fe;
        index index.html;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
sudo systemctl restart nginx


-- ==========================================
-- DROP DATABASE AND CREATE FRESH
-- ==========================================
DROP DATABASE IF EXISTS hr_manager;
CREATE DATABASE hr_manager;
USE hr_manager;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee') DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- EMPLOYEES TABLE
-- ==========================================
CREATE TABLE employees (
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

-- ==========================================
-- LEAVES TABLE
-- ==========================================
CREATE TABLE leaves (
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

-- ==========================================
-- PAYROLL TABLE
-- ==========================================
CREATE TABLE payroll (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    month TINYINT NOT NULL,
    year YEAR NOT NULL,
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

-- ==========================================
-- SAMPLE USERS
-- ==========================================
INSERT INTO users (id, username, email, password, role) VALUES
(1, 'admin', 'admin@hrmanager.com', '$2b$10$YOUR_HASH_HERE', 'admin'),
(2, 'john.doe', 'john.doe@company.com', '$2b$10$YOUR_HASH_HERE', 'employee');

-- ==========================================
-- SAMPLE EMPLOYEES
-- ==========================================
INSERT INTO employees (id, user_id, first_name, last_name, email, phone, position, department, hire_date, salary, status) VALUES
(1, 2, 'John', 'Doe', 'john.doe@company.com', '+1234567890', 'Software Engineer', 'IT', '2023-01-15', 60000.00, 'active'),
(2, NULL, 'Jane', 'Smith', 'jane.smith@company.com', '+1234567891', 'HR Specialist', 'Human Resources', '2023-02-20', 55000.00, 'active'),
(3, NULL, 'Bob', 'Johnson', 'bob.johnson@company.com', '+1234567892', 'Product Manager', 'Product', '2023-03-10', 75000.00, 'active'),
(4, NULL, 'Alice', 'Williams', 'alice.williams@company.com', '+1234567893', 'UX Designer', 'Design', '2023-04-05', 58000.00, 'active'),
(5, NULL, 'Charlie', 'Brown', 'charlie.brown@company.com', '+1234567894', 'Sales Rep', 'Sales', '2023-05-12', 52000.00, 'inactive');

-- ==========================================
-- SAMPLE LEAVES
-- ==========================================
INSERT INTO leaves (employee_id, leave_type, start_date, end_date, reason, status) VALUES
(1, 'vacation', '2024-03-01', '2024-03-05', 'Family vacation', 'approved'),
(1, 'sick', '2024-02-10', '2024-02-11', 'Flu', 'approved'),
(2, 'personal', '2024-03-15', '2024-03-15', 'Personal appointment', 'pending'),
(3, 'vacation', '2024-04-01', '2024-04-07', 'Spring break', 'pending'),
(4, 'sick', '2024-02-20', '2024-02-22', 'Medical leave', 'approved');

-- ==========================================
-- SAMPLE PAYROLL
-- ==========================================
INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary, payment_date, status) VALUES
(1, 1, 2024, 60000.00, 5000.00, 2000.00, 63000.00, '2024-01-31', 'paid'),
(2, 1, 2024, 55000.00, 4000.00, 1500.00, 57500.00, '2024-01-31', 'paid'),
(3, 1, 2024, 75000.00, 6000.00, 2500.00, 78500.00, '2024-01-31', 'paid'),
(1, 2, 2024, 60000.00, 5000.00, 2000.00, 63000.00, '2024-02-29', 'paid'),
(2, 2, 2024, 55000.00, 4000.00, 1500.00, 57500.00, NULL, 'pending');


AL-2

sudo yum update -y
sudo amazon-linux-extras install nginx1 -y   # AL2 uses amazon-linux-extras for Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx

sudo yum install mariadb-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo systemctl status mariadb

sudo mysql_secure_installation

amazon-linux-extras list | grep nodejs
sudo amazon-linux-extras enable nodejs14  # or nodejs16
sudo yum install nodejs -y

node -v
npm -v


```sh
sudo dnf update -y
sudo dnf install nginx git -y
sudo systemctl start nginx
sudo systemctl enable nginx
```


```sh
sudo dnf install mariadb105-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
dnf module list nodejs
sudo dnf install nodejs -y
node -v
npm -v
```
```sh
sudo mysql_secure_installation
```
mysql -u root -p
