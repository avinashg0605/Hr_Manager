// API Configuration
const API_URL = '/api';
let authToken = localStorage.getItem('token');
let currentUser = null;

// Dark Mode Functions
function initDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const toggleBtn = document.querySelector('.btn-theme-toggle');
        if (toggleBtn) toggleBtn.textContent = '☀️ Light';
    }
}

function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const toggleBtn = document.querySelector('.btn-theme-toggle');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        if (toggleBtn) toggleBtn.textContent = '🌙 Dark';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        if (toggleBtn) toggleBtn.textContent = '☀️ Light';
    }
}

// Toast Notification Function
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Authentication Functions
function checkAuth() {
    if (!authToken) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            authToken = data.token;
            currentUser = data.user;
            window.location.href = 'dashboard.html';
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Login failed. Please try again.', 'error');
    }
}

async function register(username, email, password, role) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });
        
        const data = await response.json();

        if (response.ok) {
            showSuccessPopup('Registration successful! Please login.', () => showTab('login'));
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Registration failed. Please try again.', 'error');
    }
}

// Helper Functions
function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
    };
}

// Confirm popup modal
function showConfirmPopup(message, callback) {
    // Remove any existing confirm modal
    const existingModal = document.getElementById('confirmModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'confirmModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <div style="text-align: center; padding: 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--warning, #f59e0b);">⚠️</div>
                <h3 style="color: var(--warning, #f59e0b); margin-bottom: 1rem;">Confirm Delete</h3>
                <p>${message}</p>
                <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;">
                    <button class="btn" style="background: var(--border-light); color: var(--text-primary);" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn btn-danger" onclick="window.confirmDeleteCallback && window.confirmDeleteCallback(); this.closest('.modal').remove();">Delete</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    window.confirmDeleteCallback = callback;
    modal.style.display = 'block';
}

// Success popup modal
function showSuccessPopup(message, callback) {
    // Remove any existing success modal
    const existingModal = document.getElementById('successModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'successModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <div style="text-align: center; padding: 1rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem; color: var(--success, #10b981);">✅</div>
                <h3 style="color: var(--success, #10b981); margin-bottom: 1rem;">Success!</h3>
                <p>${message}</p>
                <button class="btn btn-secondary" style="margin-top: 1.5rem;" onclick="this.closest('.modal').remove(); ${callback ? 'window.successCallback && window.successCallback()' : ''}">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    if (callback) window.successCallback = callback;
    modal.style.display = 'block';
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (modal && modal.parentNode) modal.remove();
    }, 3000);
}

// Dashboard Functions
async function loadDashboard() {
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            document.getElementById('userName').textContent = user.username;
        } else {
            document.getElementById('userName').textContent = 'User';
        }
        
        // Load statistics
        const employeesRes = await fetch(`${API_URL}/employees`);
        const employees = await employeesRes.json();
        
        const leavesRes = await fetch(`${API_URL}/leaves`);
        const leaves = await leavesRes.json();
        
        const payrollRes = await fetch(`${API_URL}/payroll`);
        const payroll = await payrollRes.json();
        
        document.getElementById('totalEmployees').textContent = employees.length;
        document.getElementById('activeEmployees').textContent = employees.filter(e => e.status === 'active').length;
        document.getElementById('pendingLeaves').textContent = leaves.filter(l => l.status === 'pending').length;
        document.getElementById('pendingPayroll').textContent = payroll.filter(p => p.status === 'pending').length;
        
        // Load recent leaves
        const recentLeaves = leaves.slice(0, 5);
        const leavesHtml = recentLeaves.map(leave => `
            <div class="recent-item">
                <strong>${leave.full_name || 'Employee'}</strong> - ${leave.leave_type}
                <br>
                <small>${new Date(leave.start_date).toLocaleDateString()} to ${new Date(leave.end_date).toLocaleDateString()}</small>
                <span class="badge badge-${leave.status}">${leave.status}</span>
            </div>
        `).join('');
        document.getElementById('recentLeaves').innerHTML = leavesHtml || '<p>No recent leaves</p>';
        
        // Load recent payroll
        const recentPayroll = payroll.slice(0, 5);
        const payrollHtml = recentPayroll.map(pay => `
            <div class="recent-item">
                <strong>${pay.full_name || 'Employee'}</strong> - ${pay.month}/${pay.year}
                <br>
                <small>Net Salary: $${parseFloat(pay.net_salary).toLocaleString()}</small>
                <span class="badge badge-${pay.status}">${pay.status}</span>
            </div>
        `).join('');
        document.getElementById('recentPayroll').innerHTML = payrollHtml || '<p>No recent payroll records</p>';
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Employee Functions
let allEmployees = [];

async function loadEmployees() {
    try {
        const response = await fetch(`${API_URL}/employees`);
        allEmployees = await response.json();
        displayEmployees(allEmployees);
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function displayEmployees(employees) {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.first_name} ${emp.last_name}</td>
            <td>${emp.email}</td>
            <td>${emp.position}</td>
            <td>${emp.department}</td>
            <td>$${parseFloat(emp.salary).toLocaleString()}</td>
            <td><span class="badge badge-${emp.status}">${emp.status}</span></td>
            <td>
                <button onclick="editEmployee(${emp.id})" class="btn-icon btn-edit">Edit</button>
                <button onclick="deleteEmployee(${emp.id})" class="btn-icon btn-danger">Delete</button>
            </td>
        `
    ).join('');
}

function searchEmployees() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allEmployees.filter(emp => 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm)
    );
    displayEmployees(filtered);
}

function showEmployeeModal(employeeId = null) {
    const modal = document.getElementById('employeeModal');
    
    if (employeeId) {
        document.getElementById('modalTitle').textContent = 'Edit Employee';
        const employee = allEmployees.find(emp => emp.id === employeeId);
        if (employee) {
            document.getElementById('employeeId').value = employee.id;
            document.getElementById('firstName').value = employee.first_name;
            document.getElementById('lastName').value = employee.last_name;
            document.getElementById('email').value = employee.email;
            document.getElementById('phone').value = employee.phone || '';
            document.getElementById('position').value = employee.position;
            document.getElementById('department').value = employee.department;
            document.getElementById('hireDate').value = employee.hire_date ? employee.hire_date.split('T')[0] : '';
            document.getElementById('salary').value = employee.salary;
            document.getElementById('status').value = employee.status;
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Add Employee';
        document.getElementById('employeeForm').reset();
        document.getElementById('employeeId').value = '';
        document.getElementById('status').value = 'active';
    }
    
    modal.style.display = 'block';
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'none';
}

async function saveEmployee(event) {
    event.preventDefault();
    
    const employeeData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        position: document.getElementById('position').value,
        department: document.getElementById('department').value,
        hire_date: document.getElementById('hireDate').value,
        salary: parseFloat(document.getElementById('salary').value),
        status: document.getElementById('status').value
    };
    
    const employeeId = document.getElementById('employeeId').value;
    const url = employeeId ? `${API_URL}/employees/${employeeId}` : `${API_URL}/employees`;
    const method = employeeId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(employeeData)
        });
        
        if (response.ok) {
            closeEmployeeModal();
            loadEmployees();
            showSuccessPopup(employeeId ? 'Employee updated successfully!' : 'Employee created successfully!');
        } else {
            const error = await response.json();
            showToast(error.error || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving employee:', error);
        showToast('Failed to save employee', 'error');
    }
}

async function editEmployee(id) {
    showEmployeeModal(id);
}

async function deleteEmployee(id) {
    showConfirmPopup('Are you sure you want to delete this employee?', async () => {
        try {
            const response = await fetch(`${API_URL}/employees/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                loadEmployees();
                showSuccessPopup('Employee deleted successfully!');
            } else {
                const error = await response.json();
                showToast(error.error || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            showToast('Failed to delete employee', 'error');
        }
    });
}

// Leave Functions
let allLeaves = [];

async function loadLeaves() {
    try {
        const response = await fetch(`${API_URL}/leaves`);
        allLeaves = await response.json();
        displayLeaves(allLeaves);
        
        // Load employees for dropdown
        const employeesRes = await fetch(`${API_URL}/employees`);
        const employees = await employeesRes.json();
        const employeeSelect = document.getElementById('employeeId');
        if (employeeSelect) {
            employeeSelect.innerHTML = '<option value="">Select Employee</option>' +
                employees.map(emp => `<option value="${emp.id}">${emp.first_name} ${emp.last_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading leaves:', error);
    }
}

function displayLeaves(leaves) {
    const tbody = document.getElementById('leavesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = leaves.map(leave => `
        <tr>
            <td>${leave.id}</td>
            <td>${leave.full_name || 'N/A'}</td>
            <td>${leave.leave_type}</td>
            <td>${new Date(leave.start_date).toLocaleDateString()}</td>
            <td>${new Date(leave.end_date).toLocaleDateString()}</td>
            <td>${leave.reason || '-'}</td>
            <td><span class="badge badge-${leave.status}">${leave.status}</span></td>
            <td>
                <button onclick="updateLeaveStatus(${leave.id}, 'approved')" class="btn-icon btn-edit">Approve</button>
                <button onclick="updateLeaveStatus(${leave.id}, 'rejected')" class="btn-icon btn-danger">Reject</button>
                <button onclick="deleteLeave(${leave.id})" class="btn-icon btn-danger">Delete</button>
            </td>
         `
    ).join('');
}

function filterLeaves() {
    const status = document.getElementById('statusFilter').value;
    const filtered = status === 'all' ? allLeaves : allLeaves.filter(l => l.status === status);
    displayLeaves(filtered);
}

function showLeaveModal(leaveId = null) {
    const modal = document.getElementById('leaveModal');
    
    if (leaveId) {
        document.getElementById('modalTitle').textContent = 'Edit Leave Request';
        const leave = allLeaves.find(l => l.id === leaveId);
        if (leave) {
            document.getElementById('leaveId').value = leave.id;
            document.getElementById('employeeId').value = leave.employee_id;
            document.getElementById('leaveType').value = leave.leave_type;
            document.getElementById('startDate').value = leave.start_date.split('T')[0];
            document.getElementById('endDate').value = leave.end_date.split('T')[0];
            document.getElementById('reason').value = leave.reason || '';
            document.getElementById('status').value = leave.status;
            document.getElementById('statusGroup').style.display = 'block';
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Request Leave';
        document.getElementById('leaveForm').reset();
        document.getElementById('leaveId').value = '';
        document.getElementById('statusGroup').style.display = 'none';
    }
    
    modal.style.display = 'block';
}

function closeLeaveModal() {
    document.getElementById('leaveModal').style.display = 'none';
}

async function saveLeave(event) {
    event.preventDefault();
    
    const leaveData = {
        employee_id: parseInt(document.getElementById('employeeId').value),
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('startDate').value,
        end_date: document.getElementById('endDate').value,
        reason: document.getElementById('reason').value
    };
    
    const leaveId = document.getElementById('leaveId').value;
    const url = leaveId ? `${API_URL}/leaves/${leaveId}` : `${API_URL}/leaves`;
    const method = leaveId ? 'PUT' : 'POST';
    
    if (leaveId && document.getElementById('status').value) {
        leaveData.status = document.getElementById('status').value;
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leaveData)
        });
        
        if (response.ok) {
            closeLeaveModal();
            loadLeaves();
            showSuccessPopup(leaveId ? 'Leave request updated!' : 'Leave request created!');
        } else {
            const error = await response.json();
            showToast(error.error || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving leave:', error);
        showToast('Failed to save leave request', 'error');
    }
}

async function updateLeaveStatus(id, status) {
    try {
        const response = await fetch(`${API_URL}/leaves/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            loadLeaves();
            showSuccessPopup(`Leave request ${status}!`);
        } else {
            const error = await response.json();
            showToast(error.error || 'Update failed', 'error');
        }
    } catch (error) {
        console.error('Error updating leave status:', error);
        showToast('Failed to update leave status', 'error');
    }
}

async function deleteLeave(id) {
    showConfirmPopup('Are you sure you want to delete this leave request?', async () => {
        try {
            const response = await fetch(`${API_URL}/leaves/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                loadLeaves();
                showSuccessPopup('Leave request deleted!');
            } else {
                const error = await response.json();
                showToast(error.error || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Error deleting leave:', error);
            showToast('Failed to delete leave request', 'error');
        }
    });
}

// Payroll Functions
let allPayroll = [];

async function loadPayroll() {
    try {
        const response = await fetch(`${API_URL}/payroll`);
        allPayroll = await response.json();
        displayPayroll(allPayroll);
        
        // Load employees for dropdown
        const employeesRes = await fetch(`${API_URL}/employees`);
        const employees = await employeesRes.json();
        const employeeSelect = document.getElementById('employeeId');
        if (employeeSelect) {
            employeeSelect.innerHTML = '<option value="">Select Employee</option>' +
                employees.map(emp => `<option value="${emp.id}">${emp.first_name} ${emp.last_name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading payroll:', error);
    }
}

function displayPayroll(payroll) {
    const tbody = document.getElementById('payrollTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = payroll.map(pay => `
        <tr>
            <td>${pay.id}</td>
            <td>${pay.full_name || 'N/A'}</td>
            <td>${pay.month}/${pay.year}</td>
            <td>$${parseFloat(pay.basic_salary).toLocaleString()}</td>
            <td>$${parseFloat(pay.allowances).toLocaleString()}</td>
            <td>$${parseFloat(pay.deductions).toLocaleString()}</td>
            <td>$${parseFloat(pay.net_salary).toLocaleString()}</td>
            <td>${pay.payment_date ? new Date(pay.payment_date).toLocaleDateString() : '-'}</td>
            <td><span class="badge badge-${pay.status}">${pay.status}</span></td>
            <td>
                <button onclick="editPayroll(${pay.id})" class="btn-icon btn-edit">Edit</button>
                <button onclick="deletePayroll(${pay.id})" class="btn-icon btn-danger">Delete</button>
            </td>
         `
    ).join('');
}

function calculateNetSalary() {
    const basicSalary = parseFloat(document.getElementById('basicSalary').value) || 0;
    const allowances = parseFloat(document.getElementById('allowances').value) || 0;
    const deductions = parseFloat(document.getElementById('deductions').value) || 0;
    const netSalary = basicSalary + allowances - deductions;
    document.getElementById('netSalary').value = netSalary.toFixed(2);
}

function showPayrollModal(payrollId = null) {
    const modal = document.getElementById('payrollModal');
    
    if (payrollId) {
        document.getElementById('modalTitle').textContent = 'Edit Payroll Record';
        const payroll = allPayroll.find(p => p.id === payrollId);
        if (payroll) {
            document.getElementById('payrollId').value = payroll.id;
            document.getElementById('employeeId').value = payroll.employee_id;
            document.getElementById('month').value = payroll.month;
            document.getElementById('year').value = payroll.year;
            document.getElementById('basicSalary').value = payroll.basic_salary;
            document.getElementById('allowances').value = payroll.allowances;
            document.getElementById('deductions').value = payroll.deductions;
            document.getElementById('netSalary').value = payroll.net_salary;
            document.getElementById('paymentDate').value = payroll.payment_date ? payroll.payment_date.split('T')[0] : '';
            document.getElementById('status').value = payroll.status;
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Add Payroll Record';
        document.getElementById('payrollForm').reset();
        document.getElementById('payrollId').value = '';
        document.getElementById('month').value = new Date().getMonth() + 1;
        document.getElementById('year').value = new Date().getFullYear();
        calculateNetSalary();
    }
    
    modal.style.display = 'block';
}

function closePayrollModal() {
    document.getElementById('payrollModal').style.display = 'none';
}

async function savePayroll(event) {
    event.preventDefault();
    
    const payrollData = {
        employee_id: parseInt(document.getElementById('employeeId').value),
        month: parseInt(document.getElementById('month').value),
        year: parseInt(document.getElementById('year').value),
        basic_salary: parseFloat(document.getElementById('basicSalary').value),
        allowances: parseFloat(document.getElementById('allowances').value),
        deductions: parseFloat(document.getElementById('deductions').value),
        net_salary: parseFloat(document.getElementById('netSalary').value),
        payment_date: document.getElementById('paymentDate').value || null,
        status: document.getElementById('status').value
    };
    
    const payrollId = document.getElementById('payrollId').value;
    const url = payrollId ? `${API_URL}/payroll/${payrollId}` : `${API_URL}/payroll`;
    const method = payrollId ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payrollData)
        });
        
        if (response.ok) {
            closePayrollModal();
            loadPayroll();
            showSuccessPopup(payrollId ? 'Payroll record updated!' : 'Payroll record created!');
        } else {
            const error = await response.json();
            showToast(error.error || 'Operation failed', 'error');
        }
    } catch (error) {
        console.error('Error saving payroll:', error);
        showToast('Failed to save payroll record', 'error');
    }
}

async function editPayroll(id) {
    showPayrollModal(id);
}

async function deletePayroll(id) {
    showConfirmPopup('Are you sure you want to delete this payroll record?', async () => {
        try {
            const response = await fetch(`${API_URL}/payroll/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                loadPayroll();
                showSuccessPopup('Payroll record deleted!');
            } else {
                const error = await response.json();
                showToast(error.error || 'Delete failed', 'error');
            }
        } catch (error) {
            console.error('Error deleting payroll:', error);
            showToast('Failed to delete payroll record', 'error');
        }
    });
}

function showGeneratePayrollModal() {
    document.getElementById('generatePayrollModal').style.display = 'block';
}

function closeGeneratePayrollModal() {
    document.getElementById('generatePayrollModal').style.display = 'none';
}

async function generatePayroll(event) {
    event.preventDefault();
    
    const data = {
        month: parseInt(document.getElementById('genMonth').value),
        year: parseInt(document.getElementById('genYear').value)
    };
    
    try {
        const response = await fetch(`${API_URL}/payroll/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const result = await response.json();
            closeGeneratePayrollModal();
            loadPayroll();
            showSuccessPopup(`Payroll generated: ${result.created} created, ${result.skipped} skipped`);
        } else {
            const error = await response.json();
            showToast(error.error || 'Generation failed', 'error');
        }
    } catch (error) {
        console.error('Error generating payroll:', error);
        showToast('Failed to generate payroll', 'error');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    
    const themeBtn = document.querySelector('.btn-theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleDarkMode);
    }
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
        currentUser = JSON.parse(userStr);
    }
    
    const pathname = window.location.pathname;
    
    if (pathname.includes('dashboard.html')) {
        loadDashboard();
    } else if (pathname.includes('employees.html')) {
        loadEmployees();
        const employeeForm = document.getElementById('employeeForm');
        if (employeeForm) employeeForm.addEventListener('submit', saveEmployee);
    } else if (pathname.includes('leaves.html')) {
        loadLeaves();
        const leaveForm = document.getElementById('leaveForm');
        if (leaveForm) leaveForm.addEventListener('submit', saveLeave);
    } else if (pathname.includes('payroll.html')) {
        loadPayroll();
        const payrollForm = document.getElementById('payrollForm');
        if (payrollForm) payrollForm.addEventListener('submit', savePayroll);
        const generateForm = document.getElementById('generatePayrollForm');
        if (generateForm) generateForm.addEventListener('submit', generatePayroll);
        const basicSalary = document.getElementById('basicSalary');
        if (basicSalary) basicSalary.addEventListener('input', calculateNetSalary);
        const allowances = document.getElementById('allowances');
        if (allowances) allowances.addEventListener('input', calculateNetSalary);
        const deductions = document.getElementById('deductions');
        if (deductions) deductions.addEventListener('input', calculateNetSalary);
    }
});

// Auth page functions
function showTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.auth-form');
    
    tabs.forEach(btn => btn.classList.remove('active'));
    forms.forEach(form => form.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('registerForm').classList.add('active');
    }
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        login(email, password);
    });
}

// Register form handler
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        register(username, email, password, role);
    });
}

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);