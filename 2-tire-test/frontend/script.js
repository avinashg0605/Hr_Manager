const API_URL = 'http://localhost:3000/api';

// Global variables
let currentView = 'dashboard';
let allEmployees = [];

// DOM Elements
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');
const globalSearch = document.getElementById('globalSearch');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadDashboard();
    loadEmployees();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });
    
    // Add employee form
    const addForm = document.getElementById('addEmployeeForm');
    if (addForm) {
        addForm.addEventListener('submit', handleAddEmployee);
    }
    
    // Edit form
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', handleUpdateEmployee);
    }
    
    // Modal close
    const closeBtn = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');
    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    
    window.onclick = (e) => {
        const modal = document.getElementById('editModal');
        if (e.target === modal) closeModal();
    };
    
    // Global search
    globalSearch.addEventListener('input', handleGlobalSearch);
}

// Switch views
function switchView(view) {
    currentView = view;
    
    // Update navigation
    navItems.forEach(item => {
        if (item.dataset.view === view) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update view visibility
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}View`).classList.add('active');
    
    // Update header
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Welcome to Employee Management System' },
        employees: { title: 'Employees', subtitle: 'Manage all employee records' },
        add: { title: 'Add Employee', subtitle: 'Add new employee to the system' },
        departments: { title: 'Departments', subtitle: 'View department wise statistics' }
    };
    
    pageTitle.textContent = titles[view].title;
    pageSubtitle.textContent = titles[view].subtitle;
    
    // Load view data
    if (view === 'dashboard') loadDashboard();
    if (view === 'employees') loadEmployees();
    if (view === 'departments') loadDepartments();
}

// Load dashboard data
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            document.getElementById('totalEmployees').textContent = stats.totalEmployees;
            document.getElementById('totalSalary').textContent = `$${stats.totalSalary.toLocaleString()}`;
            document.getElementById('avgSalary').textContent = `$${stats.avgSalary.toLocaleString()}`;
            document.getElementById('totalDepts').textContent = Object.keys(stats.departmentStats).length;
            
            // Load recent employees
            const empResponse = await fetch(`${API_URL}/employees`);
            const empResult = await empResponse.json();
            if (empResult.success) {
                const recentEmployees = empResult.data.slice(-4).reverse();
                displayRecentEmployees(recentEmployees);
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

// Display recent employees
function displayRecentEmployees(employees) {
    const container = document.getElementById('recentEmployeesList');
    if (!container) return;
    
    if (employees.length === 0) {
        container.innerHTML = '<div class="loading">No employees found</div>';
        return;
    }
    
    container.innerHTML = employees.map(emp => `
        <div class="employee-card">
            <h3><i class="fas fa-user"></i> ${escapeHtml(emp.name)}</h3>
            <p><i class="fas fa-briefcase"></i> ${escapeHtml(emp.position)}</p>
            <p><i class="fas fa-building"></i> ${escapeHtml(emp.department)}</p>
            <p><i class="fas fa-dollar-sign"></i> $${emp.salary.toLocaleString()}</p>
            <p><i class="fas fa-calendar"></i> Joined: ${emp.joinDate}</p>
        </div>
    `).join('');
}

// Load all employees
async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        const result = await response.json();
        
        if (result.success) {
            allEmployees = result.data;
            displayEmployeesTable(allEmployees);
        }
    } catch (error) {
        console.error('Error loading employees:', error);
        showAlert('Error loading employees', 'error');
    }
}

// Display employees table
function displayEmployeesTable(employees) {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="loading">No employees found</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.id}</td>
            <td><strong>${escapeHtml(emp.name)}</strong></td>
            <td>${escapeHtml(emp.position)}</td>
            <td>${escapeHtml(emp.department)}</td>
            <td>$${emp.salary.toLocaleString()}</td>
            <td>${escapeHtml(emp.email)}</td>
            <td>
                <button class="btn btn-edit" onclick="editEmployee(${emp.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-delete" onclick="deleteEmployee(${emp.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Handle add employee
async function handleAddEmployee(e) {
    e.preventDefault();
    
    const employeeData = {
        name: document.getElementById('name').value,
        position: document.getElementById('position').value,
        department: document.getElementById('department').value,
        salary: parseFloat(document.getElementById('salary').value),
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        joinDate: document.getElementById('joinDate').value || new Date().toISOString().split('T')[0]
    };
    
    try {
        const response = await fetch(`${API_URL}/employees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Employee added successfully!', 'success');
            e.target.reset();
            loadEmployees();
            if (currentView === 'dashboard') loadDashboard();
            switchView('employees');
        } else {
            showAlert(result.message || 'Error adding employee', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to add employee', 'error');
    }
}

// Edit employee
async function editEmployee(id) {
    try {
        const response = await fetch(`${API_URL}/employees/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const emp = result.data;
            document.getElementById('editId').value = emp.id;
            document.getElementById('editName').value = emp.name;
            document.getElementById('editPosition').value = emp.position;
            document.getElementById('editDepartment').value = emp.department;
            document.getElementById('editSalary').value = emp.salary;
            document.getElementById('editEmail').value = emp.email;
            document.getElementById('editPhone').value = emp.phone || '';
            document.getElementById('editJoinDate').value = emp.joinDate;
            
            document.getElementById('editModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error fetching employee details', 'error');
    }
}

// Handle update employee
async function handleUpdateEmployee(e) {
    e.preventDefault();
    
    const id = document.getElementById('editId').value;
    const employeeData = {
        name: document.getElementById('editName').value,
        position: document.getElementById('editPosition').value,
        department: document.getElementById('editDepartment').value,
        salary: parseFloat(document.getElementById('editSalary').value),
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        joinDate: document.getElementById('editJoinDate').value
    };
    
    try {
        const response = await fetch(`${API_URL}/employees/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Employee updated successfully!', 'success');
            closeModal();
            loadEmployees();
            if (currentView === 'dashboard') loadDashboard();
        } else {
            showAlert(result.message || 'Error updating employee', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to update employee', 'error');
    }
}

// Delete employee
async function deleteEmployee(id) {
    if (confirm('Are you sure you want to delete this employee?')) {
        try {
            const response = await fetch(`${API_URL}/employees/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                showAlert('Employee deleted successfully!', 'success');
                loadEmployees();
                if (currentView === 'dashboard') loadDashboard();
                if (currentView === 'departments') loadDepartments();
            } else {
                showAlert(result.message || 'Error deleting employee', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlert('Failed to delete employee', 'error');
        }
    }
}

// Load departments
async function loadDepartments() {
    try {
        const response = await fetch(`${API_URL}/departments`);
        const result = await response.json();
        
        if (result.success) {
            const departments = result.data;
            const statsResponse = await fetch(`${API_URL}/stats`);
            const statsResult = await statsResponse.json();
            
            if (statsResult.success) {
                displayDepartments(departments, statsResult.data.departmentStats);
            }
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        showAlert('Error loading departments', 'error');
    }
}

// Display departments
function displayDepartments(departments, stats) {
    const container = document.getElementById('departmentsList');
    if (!container) return;
    
    container.innerHTML = departments.map(dept => {
        const deptStats = stats[dept] || { count: 0, totalSalary: 0 };
        return `
            <div class="department-card">
                <div class="department-header">
                    <i class="fas fa-building"></i>
                    <h3>${escapeHtml(dept)}</h3>
                </div>
                <div class="department-stats">
                    <div class="stat-item">
                        <div class="stat-value">${deptStats.count}</div>
                        <div class="stat-label">Employees</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">$${deptStats.totalSalary.toLocaleString()}</div>
                        <div class="stat-label">Total Salary</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">$${deptStats.count ? Math.round(deptStats.totalSalary / deptStats.count).toLocaleString() : 0}</div>
                        <div class="stat-label">Avg Salary</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Handle global search
function handleGlobalSearch() {
    const searchTerm = globalSearch.value.toLowerCase();
    
    if (currentView === 'employees') {
        const filtered = allEmployees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm) ||
            emp.position.toLowerCase().includes(searchTerm) ||
            emp.department.toLowerCase().includes(searchTerm) ||
            emp.email.toLowerCase().includes(searchTerm)
        );
        displayEmployeesTable(filtered);
    }
}

// Show add employee form
function showAddEmployeeForm() {
    switchView('add');
}

// Close modal
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Show alert
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global for onclick handlers
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.showAddEmployeeForm = showAddEmployeeForm;