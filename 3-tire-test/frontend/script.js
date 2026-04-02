const API_URL = 'http://localhost:3000/api';

let currentView = 'dashboard';
let allEmployees = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadDashboard();
    loadEmployees();
});

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });
    
    // Mobile menu
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('mobile-open');
        });
    }
    
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
    const modalClose = document.querySelector('.modal-close');
    const modalCancel = document.querySelector('.modal-cancel');
    if (modalClose) modalClose.onclick = closeModal;
    if (modalCancel) modalCancel.onclick = closeModal;
    
    window.onclick = (e) => {
        const modal = document.getElementById('editModal');
        if (e.target === modal) closeModal();
    };
    
    // Global search
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', debounce(handleGlobalSearch, 300));
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Switch views
function switchView(view) {
    currentView = view;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.view === view) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update view visibility
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}View`).classList.add('active');
    
    // Update header
    const titles = {
        dashboard: { title: 'Dashboard', subtitle: 'Welcome back, here\'s your workspace overview' },
        employees: { title: 'Employee Directory', subtitle: 'Manage and view all employee records' },
        add: { title: 'Add Employee', subtitle: 'Enter the employee details below' },
        departments: { title: 'Departments', subtitle: 'View department-wise employee statistics' },
        analytics: { title: 'Analytics Dashboard', subtitle: 'Comprehensive workforce analytics' }
    };
    
    document.getElementById('pageTitle').textContent = titles[view].title;
    document.getElementById('pageSubtitle').textContent = titles[view].subtitle;
    
    // Load view data
    if (view === 'dashboard') loadDashboard();
    if (view === 'employees') loadEmployees();
    if (view === 'departments') loadDepartments();
    if (view === 'analytics') loadAnalytics();
}

// Load dashboard data
async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/employees/stats`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            displayStats(stats);
            displayRecentEmployees();
            displayDepartmentChart(stats.departmentStats);
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error loading dashboard data', 'error');
    }
}

// Display stats
function displayStats(stats) {
    const statsGrid = document.getElementById('statsGrid');
    if (!statsGrid) return;
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-info">
                <h3>${stats.totalEmployees}</h3>
                <p>Total Employees</p>
            </div>
            <div class="stat-icon">
                <i class="fas fa-users"></i>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>$${stats.totalSalary.toLocaleString()}</h3>
                <p>Total Salary Pool</p>
            </div>
            <div class="stat-icon">
                <i class="fas fa-dollar-sign"></i>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>$${stats.avgSalary.toLocaleString()}</h3>
                <p>Average Salary</p>
            </div>
            <div class="stat-icon">
                <i class="fas fa-chart-line"></i>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-info">
                <h3>${stats.totalDepartments}</h3>
                <p>Departments</p>
            </div>
            <div class="stat-icon">
                <i class="fas fa-building"></i>
            </div>
        </div>
    `;
}

// Display recent employees
async function displayRecentEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        const result = await response.json();
        
        if (result.success) {
            const recent = result.data.slice(-5).reverse();
            const container = document.getElementById('recentEmployees');
            if (!container) return;
            
            container.innerHTML = recent.map(emp => `
                <div class="recent-item">
                    <div class="recent-info">
                        <h4>${escapeHtml(emp.name)}</h4>
                        <p>${escapeHtml(emp.position)} • ${escapeHtml(emp.department)}</p>
                    </div>
                    <div class="recent-salary">$${emp.salary.toLocaleString()}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent employees:', error);
    }
}

// Display department chart (simple bar chart)
function displayDepartmentChart(deptStats) {
    const container = document.getElementById('departmentChart');
    if (!container || !deptStats) return;
    
    const maxCount = Math.max(...deptStats.map(d => d.count));
    
    container.innerHTML = `
        <div style="padding: 20px;">
            ${deptStats.map(dept => `
                <div style="margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 14px; font-weight: 500;">${dept.department}</span>
                        <span style="font-size: 14px; color: var(--primary);">${dept.count} employees</span>
                    </div>
                    <div style="background: var(--light); border-radius: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, var(--primary), var(--primary-light)); 
                                    width: ${(dept.count / maxCount) * 100}%; 
                                    height: 8px; 
                                    border-radius: 8px;">
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load employees
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
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No employees found</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(emp => {
        const initials = emp.name.split(' ').map(n => n[0]).join('').toUpperCase();
        return `
            <tr>
                <td>
                    <div class="employee-info">
                        <div class="employee-avatar">${initials}</div>
                        <div class="employee-details">
                            <div class="employee-name">${escapeHtml(emp.name)}</div>
                            <div class="employee-email">${escapeHtml(emp.email)}</div>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(emp.position)}</td>
                <td>${escapeHtml(emp.department)}</td>
                <td>$${emp.salary.toLocaleString()}</td>
                <td>
                    <span class="status-badge status-${emp.status || 'active'}">
                        ${emp.status || 'active'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="editEmployee(${emp.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-icon btn-delete" onclick="deleteEmployee(${emp.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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
        join_date: document.getElementById('joinDate').value || new Date().toISOString().split('T')[0]
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
            loadDashboard();
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
            document.getElementById('editJoinDate').value = emp.join_date;
            document.getElementById('editStatus').value = emp.status || 'active';
            
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
        join_date: document.getElementById('editJoinDate').value,
        status: document.getElementById('editStatus').value
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
            loadDashboard();
            if (currentView === 'departments') loadDepartments();
            if (currentView === 'analytics') loadAnalytics();
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
                loadDashboard();
                if (currentView === 'departments') loadDepartments();
                if (currentView === 'analytics') loadAnalytics();
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
        const response = await fetch(`${API_URL}/employees/departments`);
        const result = await response.json();
        
        if (result.success) {
            const departments = result.data;
            const statsResponse = await fetch(`${API_URL}/employees/stats`);
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
    const container = document.getElementById('departmentsGrid');
    if (!container) return;
    
    const icons = {
        'Executive': 'fa-crown',
        'Technology': 'fa-code',
        'Human Resources': 'fa-users',
        'Sales': 'fa-chart-line',
        'Product': 'fa-box',
        'Marketing': 'fa-bullhorn',
        'Finance': 'fa-chart-pie'
    };
    
    container.innerHTML = departments.map(dept => {
        const deptStat = stats.find(s => s.department === dept) || { count: 0, totalSalary: 0, avgSalary: 0 };
        const icon = icons[dept] || 'fa-building';
        
        return `
            <div class="department-card">
                <div class="department-header">
                    <div class="department-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <h3>${escapeHtml(dept)}</h3>
                </div>
                <div class="department-stats">
                    <div class="stat-item">
                        <div class="stat-value">${deptStat.count}</div>
                        <div class="stat-label">Employees</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">$${deptStat.totalSalary.toLocaleString()}</div>
                        <div class="stat-label">Total Salary</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">$${Math.round(deptStat.avgSalary).toLocaleString()}</div>
                        <div class="stat-label">Avg Salary</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load analytics
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_URL}/employees/stats`);
        const result = await response.json();
        
        if (result.success) {
            displaySalaryChart(result.data.departmentStats);
            displayHeadcountChart(result.data.departmentStats);
        }
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

// Display salary chart
function displaySalaryChart(deptStats) {
    const container = document.getElementById('salaryChart');
    if (!container) return;
    
    const maxSalary = Math.max(...deptStats.map(d => d.totalSalary));
    
    container.innerHTML = `
        <div style="padding: 20px;">
            ${deptStats.map(dept => `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 14px; font-weight: 500;">${dept.department}</span>
                        <span style="font-size: 14px; color: var(--primary);">$${dept.totalSalary.toLocaleString()}</span>
                    </div>
                    <div style="background: var(--light); border-radius: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #10b981, #34d399); 
                                    width: ${(dept.totalSalary / maxSalary) * 100}%; 
                                    height: 30px; 
                                    border-radius: 8px;
                                    display: flex;
                                    align-items: center;
                                    padding: 0 12px;
                                    color: white;
                                    font-size: 12px;
                                    font-weight: 500;">
                            ${Math.round((dept.totalSalary / maxSalary) * 100)}%
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Display headcount chart
function displayHeadcountChart(deptStats) {
    const container = document.getElementById('headcountChart');
    if (!container) return;
    
    const maxCount = Math.max(...deptStats.map(d => d.count));
    
    container.innerHTML = `
        <div style="padding: 20px;">
            ${deptStats.map(dept => `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                        <span style="font-size: 14px; font-weight: 500;">${dept.department}</span>
                        <span style="font-size: 14px; color: var(--primary);">${dept.count} employees</span>
                    </div>
                    <div style="background: var(--light); border-radius: 8px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #f59e0b, #fbbf24); 
                                    width: ${(dept.count / maxCount) * 100}%; 
                                    height: 30px; 
                                    border-radius: 8px;
                                    display: flex;
                                    align-items: center;
                                    padding: 0 12px;
                                    color: white;
                                    font-size: 12px;
                                    font-weight: 500;">
                            ${dept.count} employees
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Handle global search
async function handleGlobalSearch() {
    const searchTerm = document.getElementById('globalSearch').value;
    
    if (currentView === 'employees' && searchTerm.length > 0) {
        try {
            const response = await fetch(`${API_URL}/employees/search?q=${encodeURIComponent(searchTerm)}`);
            const result = await response.json();
            
            if (result.success) {
                displayEmployeesTable(result.data);
            }
        } catch (error) {
            console.error('Error searching:', error);
        }
    } else if (currentView === 'employees' && searchTerm.length === 0) {
        loadEmployees();
    }
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
    
    setTimeout(() => {
        alert.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions global
window.switchView = switchView;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;