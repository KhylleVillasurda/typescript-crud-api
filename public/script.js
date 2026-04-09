"use strict";
// ============================================================
// Types
// ============================================================
// ============================================================
// State
// ============================================================
let currentUser = null;
// ============================================================
// API Helper
// ============================================================
const API = ""; // same origin — server serves both API and frontend
async function apiFetch(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };
    if (currentUser?.token) {
        headers["Authorization"] = `Bearer ${currentUser.token}`;
    }
    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data;
}
// ============================================================
// Page Navigation
// ============================================================
function showPage(pageName) {
    const adminPages = ["employees", "accounts", "departments"];
    const protectedPages = ["profile", "requests", ...adminPages];
    if (adminPages.includes(pageName) && currentUser?.role !== "Admin") {
        showToast("Access denied. Admins only.", "danger");
        showPage("landing");
        return;
    }
    if (protectedPages.includes(pageName) && !currentUser) {
        showToast("Please log in first.", "warning");
        showPage("login");
        return;
    }
    document.querySelectorAll(".page").forEach((p) => {
        p.classList.remove("active");
    });
    const pageEl = document.getElementById(pageName + "Page");
    if (!pageEl)
        return;
    pageEl.classList.add("active");
    window.location.hash = pageName;
    // Trigger page-specific loads
    if (pageName === "profile" && currentUser)
        updateProfilePage();
    else if (pageName === "employees")
        loadEmployeesPage();
    else if (pageName === "departments")
        loadDepartmentsPage();
    else if (pageName === "accounts")
        loadAccountsPage();
    else if (pageName === "requests")
        loadRequestsPage();
    // Close mobile nav if open
    const nav = document.getElementById("navbarNav");
    if (nav?.classList.contains("show"))
        nav.classList.remove("show");
}
// Expose globally so inline onclick="" attributes work
window.showPage = showPage;
// ============================================================
// Auth State
// ============================================================
function setAuthState(user) {
    currentUser = user;
    const body = document.body;
    body.classList.remove("authenticated", "not-authenticated", "is-admin");
    if (user) {
        body.classList.add("authenticated");
        if (user.role === "Admin")
            body.classList.add("is-admin");
        const nameEl = document.getElementById("userDropdownName");
        if (nameEl)
            nameEl.textContent = user.firstName || user.email;
        sessionStorage.setItem("authUser", JSON.stringify(user));
    }
    else {
        body.classList.add("not-authenticated");
        sessionStorage.removeItem("authUser");
    }
}
// ============================================================
// Register
// ============================================================
async function handleRegister(event) {
    event.preventDefault();
    const firstName = document.getElementById("fname").value.trim();
    const lastName = document.getElementById("lname").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirmPassword = document.getElementById("regConfirmPassword").value;
    try {
        const result = await apiFetch("/users/register", {
            method: "POST",
            body: JSON.stringify({ firstName, lastName, email, password, confirmPassword }),
        });
        // Store the token so the verify page can use it for the simulation button
        sessionStorage.setItem("pendingVerificationToken", result.verificationToken);
        sessionStorage.setItem("pendingVerificationEmail", email);
        const verifyEmailEl = document.getElementById("verifyEmail");
        if (verifyEmailEl)
            verifyEmailEl.textContent = email;
        showToast("Registration successful! Please verify your email.", "success");
        document.getElementById("registerForm").reset();
        showPage("verify");
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
window.handleRegister = handleRegister;
// ============================================================
// Verify Email (demo simulation)
// ============================================================
async function simulateVerification() {
    const token = sessionStorage.getItem("pendingVerificationToken");
    if (!token) {
        showToast("No pending verification found. Please register first.", "warning");
        showPage("register");
        return;
    }
    try {
        await apiFetch("/users/verify-email", {
            method: "POST",
            body: JSON.stringify({ token }),
        });
        sessionStorage.removeItem("pendingVerificationToken");
        sessionStorage.removeItem("pendingVerificationEmail");
        showToast("Email verified! You can now log in.", "success");
        showPage("login");
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
window.simulateVerification = simulateVerification;
// ============================================================
// Login
// ============================================================
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("pwd").value;
    try {
        const user = await apiFetch("/users/authenticate", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });
        setAuthState(user);
        showToast(`Welcome back, ${user.firstName}!`, "success");
        document.getElementById("loginForm").reset();
        showPage("profile");
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
window.handleLogin = handleLogin;
// ============================================================
// Logout
// ============================================================
function logout() {
    setAuthState(null);
    showToast("Logged out successfully.", "success");
    showPage("landing");
}
window.logout = logout;
// ============================================================
// Profile Page
// ============================================================
function updateProfilePage() {
    if (!currentUser)
        return;
    const el = (id) => document.getElementById(id);
    const nameEl = el("profileName");
    if (nameEl)
        nameEl.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    const emailEl = el("profileEmail");
    if (emailEl)
        emailEl.textContent = currentUser.email;
    const roleEl = el("profileRole");
    if (roleEl)
        roleEl.textContent = currentUser.role;
}
// ============================================================
// Employees Page
// ============================================================
async function loadEmployeesPage() {
    try {
        const employees = await apiFetch("/employees");
        renderEmployeesTable(employees);
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
function renderEmployeesTable(employees) {
    const tbody = document.getElementById("employeeTableBody");
    if (!tbody)
        return;
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No employees.</td></tr>';
        return;
    }
    tbody.innerHTML = employees.map((emp) => `
        <tr>
            <td>${emp.id}</td>
            <td>${emp.userEmail}</td>
            <td>${emp.position}</td>
            <td>${emp.department}</td>
            <td>${emp.hireDate}</td>
            <td>
                <button class="btn btn-sm action-btn-edit"   onclick="editEmployee(${emp.id})">Edit</button>
                <button class="btn btn-sm action-btn-delete" onclick="deleteEmployee(${emp.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}
function showAddEmployeeForm() {
    document.getElementById("employeeFormContainer").style.display = "block";
    document.getElementById("employeeTableContainer").style.display = "none";
    document.getElementById("employeeFormTitle").textContent = "Add Employee";
    document.getElementById("employeeForm").reset();
    delete document.getElementById("employeeForm").dataset.editingId;
    document.getElementById("empId").readOnly = false;
}
function hideEmployeeForm() {
    document.getElementById("employeeFormContainer").style.display = "none";
    document.getElementById("employeeTableContainer").style.display = "block";
}
async function editEmployee(id) {
    try {
        const emp = await apiFetch(`/employees/${id}`);
        document.getElementById("employeeFormContainer").style.display = "block";
        document.getElementById("employeeTableContainer").style.display = "none";
        document.getElementById("employeeFormTitle").textContent = "Edit Employee";
        document.getElementById("empId").value = String(emp.id);
        document.getElementById("empId").readOnly = true;
        document.getElementById("empEmail").value = emp.userEmail;
        document.getElementById("empPosition").value = emp.position;
        document.getElementById("empDept").value = emp.department;
        document.getElementById("empHireDate").value = emp.hireDate;
        document.getElementById("employeeForm").dataset.editingId = emp.id;
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
async function handleEmployeeSave(event) {
    event.preventDefault();
    const editingId = document.getElementById("employeeForm").dataset.editingId;
    const payload = {
        userEmail: document.getElementById("empEmail").value.trim(),
        position: document.getElementById("empPosition").value.trim(),
        department: document.getElementById("empDept").value,
        hireDate: document.getElementById("empHireDate").value,
    };
    try {
        if (editingId) {
            await apiFetch(`/employees/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
            showToast("Employee updated.", "success");
        }
        else {
            await apiFetch("/employees", { method: "POST", body: JSON.stringify(payload) });
            showToast("Employee added.", "success");
        }
        hideEmployeeForm();
        loadEmployeesPage();
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
async function deleteEmployee(id) {
    if (!confirmAction("Are you sure you want to delete this employee?"))
        return;
    try {
        await apiFetch(`/employees/${id}`, { method: "DELETE" });
        showToast("Employee deleted.", "success");
        loadEmployeesPage();
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
window.showAddEmployeeForm = showAddEmployeeForm;
window.hideEmployeeForm = hideEmployeeForm;
window.editEmployee = editEmployee;
window.handleEmployeeSave = handleEmployeeSave;
window.deleteEmployee = deleteEmployee;
// ============================================================
// Departments Page
// ============================================================
async function loadDepartmentsPage() {
    try {
        const departments = await apiFetch("/departments");
        renderDepartmentsTable(departments);
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
function renderDepartmentsTable(departments) {
    const tbody = document.getElementById("departmentTableBody");
    if (!tbody)
        return;
    tbody.innerHTML = departments.map((dept) => `
        <tr>
            <td>${dept.name}</td>
            <td>${dept.description}</td>
            <td>
                <button class="btn btn-sm action-btn-edit"   onclick="editDepartment(${dept.id})">Edit</button>
                <button class="btn btn-sm action-btn-delete" onclick="deleteDepartment(${dept.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}
function showAddDepartmentForm() {
    document.getElementById("departmentFormContainer").style.display = "block";
    document.getElementById("departmentTableContainer").style.display = "none";
    document.getElementById("departmentFormTitle").textContent = "Add Department";
    document.getElementById("departmentForm").reset();
    delete document.getElementById("departmentForm").dataset.editingId;
}
function hideDepartmentForm() {
    document.getElementById("departmentFormContainer").style.display = "none";
    document.getElementById("departmentTableContainer").style.display = "block";
}
async function editDepartment(id) {
    try {
        const dept = await apiFetch(`/departments/${id}`);
        document.getElementById("departmentFormContainer").style.display = "block";
        document.getElementById("departmentTableContainer").style.display = "none";
        document.getElementById("departmentFormTitle").textContent = "Edit Department";
        document.getElementById("deptName").value = dept.name;
        document.getElementById("deptDesc").value = dept.description;
        document.getElementById("departmentForm").dataset.editingId = dept.id;
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
async function handleDepartmentSave(event) {
    event.preventDefault();
    const editingId = document.getElementById("departmentForm").dataset.editingId;
    const payload = {
        name: document.getElementById("deptName").value.trim(),
        description: document.getElementById("deptDesc").value.trim(),
    };
    try {
        if (editingId) {
            await apiFetch(`/departments/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
            showToast("Department updated.", "success");
        }
        else {
            await apiFetch("/departments", { method: "POST", body: JSON.stringify(payload) });
            showToast("Department added.", "success");
        }
        hideDepartmentForm();
        loadDepartmentsPage();
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
async function deleteDepartment(id) {
    if (!confirmAction("Are you sure you want to delete this department?"))
        return;
    try {
        await apiFetch(`/departments/${id}`, { method: "DELETE" });
        showToast("Department deleted.", "success");
        loadDepartmentsPage();
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
window.showAddDepartmentForm = showAddDepartmentForm;
window.hideDepartmentForm = hideDepartmentForm;
window.editDepartment = editDepartment;
window.handleDepartmentSave = handleDepartmentSave;
window.deleteDepartment = deleteDepartment;
// ============================================================
// Accounts Page (Admin)
// ============================================================
async function loadAccountsPage() {
    try {
        const accounts = await apiFetch("/users");
        renderAccountsTable(accounts);
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
function renderAccountsTable(accounts) {
    const tbody = document.getElementById("accountTableBody");
    if (!tbody)
        return;
    tbody.innerHTML = accounts.map((acc) => `
        <tr>
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${acc.role}</td>
            <td style="font-size:1.2rem">${acc.verified ? "✔️" : "⏳"}</td>
            <td>
                <button class="btn btn-sm action-btn-edit"      onclick="editAccount(${acc.id})">Edit</button>
                <button class="btn btn-sm action-btn-resetPass" onclick="resetPassword(${acc.id})">Reset Password</button>
                <button class="btn btn-sm action-btn-delete"    onclick="deleteAccount(${acc.id})">Delete</button>
            </td>
        </tr>
    `).join("");
}
function showAddAccountForm() {
    document.getElementById("accountFormContainer").style.display = "block";
    document.getElementById("accountTableContainer").style.display = "none";
    document.getElementById("accountFormTitle").textContent = "Add Account";
    document.getElementById("accountForm").reset();
    document.getElementById("accEmail").readOnly = false;
    delete document.getElementById("accountForm").dataset.editingId;
    // Show confirm-password field for new accounts
    const cpWrap = document.getElementById("accConfirmPasswordWrap");
    if (cpWrap)
        cpWrap.style.display = "block";
}
function hideAccountForm() {
    document.getElementById("accountFormContainer").style.display = "none";
    document.getElementById("accountTableContainer").style.display = "block";
}
async function editAccount(id) {
    try {
        const acc = await apiFetch(`/users/${id}`);
        document.getElementById("accountFormContainer").style.display = "block";
        document.getElementById("accountTableContainer").style.display = "none";
        document.getElementById("accountFormTitle").textContent = "Edit Account";
        document.getElementById("accFirstName").value = acc.firstName;
        document.getElementById("accLastName").value = acc.lastName;
        document.getElementById("accEmail").value = acc.email;
        document.getElementById("accEmail").readOnly = true;
        document.getElementById("accRole").value = acc.role;
        document.getElementById("accVerified").checked = acc.verified;
        document.getElementById("accPassword").value = "";
        // Hide confirm-password field in edit mode (password change is optional)
        const cpWrap = document.getElementById("accConfirmPasswordWrap");
        if (cpWrap)
            cpWrap.style.display = "none";
        document.getElementById("accountForm").dataset.editingId = id;
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
async function handleAccountSave(event) {
    event.preventDefault();
    const editingId = document.getElementById("accountForm").dataset.editingId;
    const password = document.getElementById("accPassword").value;
    const payload = {
        firstName: document.getElementById("accFirstName").value.trim(),
        lastName: document.getElementById("accLastName").value.trim(),
        email: document.getElementById("accEmail").value.trim(),
        role: document.getElementById("accRole").value,
        verified: document.getElementById("accVerified").checked,
    };
    if (password) {
        payload.password = password;
        payload.confirmPassword = document.getElementById("accConfirmPassword")?.value ?? password;
    }
    try {
        if (editingId) {
            await apiFetch(`/users/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
            showToast("Account updated.", "success");
        }
        else {
            await apiFetch("/users", { method: "POST", body: JSON.stringify(payload) });
            showToast("Account created.", "success");
        }
        hideAccountForm();
        loadAccountsPage();
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
async function resetPassword(id) {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (!newPassword)
        return;
    if (newPassword.length < 6) {
        showToast("Password must be at least 6 characters!", "warning");
        return;
    }
    try {
        await apiFetch(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify({ password: newPassword, confirmPassword: newPassword }),
        });
        showToast("Password reset successfully!", "success");
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
async function deleteAccount(id) {
    if (currentUser?.id === id) {
        showToast("You cannot delete your own account!", "danger");
        return;
    }
    if (!confirmAction("Are you sure you want to delete this account?"))
        return;
    try {
        await apiFetch(`/users/${id}`, { method: "DELETE" });
        showToast("Account deleted.", "success");
        loadAccountsPage();
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
window.showAddAccountForm = showAddAccountForm;
window.hideAccountForm = hideAccountForm;
window.editAccount = editAccount;
window.handleAccountSave = handleAccountSave;
window.resetPassword = resetPassword;
window.deleteAccount = deleteAccount;
// ============================================================
// Requests Page
// ============================================================
async function loadRequestsPage() {
    try {
        const reqs = await apiFetch("/requests");
        renderRequestsTable(reqs);
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
function renderRequestsTable(reqs) {
    const container = document.getElementById("requestsContainer");
    const table = document.getElementById("requestsTable");
    const tbody = document.getElementById("requestsTableBody");
    if (reqs.length === 0) {
        container.style.display = "block";
        table.style.display = "none";
        return;
    }
    container.style.display = "none";
    table.style.display = "table";
    const badgeMap = {
        Pending: "warning text-dark",
        Approved: "success",
        Rejected: "danger",
    };
    tbody.innerHTML = reqs.map((req) => {
        const items = req.items.map((i) => `${i.name} (${i.qty})`).join(", ");
        const badge = badgeMap[req.status] ?? "secondary";
        return `
            <tr>
                <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                <td>${req.type}</td>
                <td>${items}</td>
                <td><span class="badge bg-${badge}">${req.status}</span></td>
            </tr>
        `;
    }).join("");
}
function addRequestItem() {
    const container = document.getElementById("requestItemsContainer");
    const div = document.createElement("div");
    div.className = "input-group mb-2 request-item";
    div.innerHTML = `
        <input type="text"   class="form-control" placeholder="Item name" required>
        <input type="number" class="form-control" placeholder="Qty" value="1" min="1" style="max-width:80px;" required>
        <button type="button" class="btn btn-danger" onclick="removeRequestItem(this)">×</button>
    `;
    container.appendChild(div);
}
function removeRequestItem(button) {
    const container = document.getElementById("requestItemsContainer");
    if (container.children.length > 1) {
        button.closest(".request-item").remove();
    }
    else {
        showToast("You must have at least one item!", "warning");
    }
}
async function handleRequestSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
        showToast("Please log in first!", "warning");
        return;
    }
    const type = document.getElementById("requestType").value;
    const items = [];
    document.querySelectorAll(".request-item").forEach((row) => {
        const inputs = row.querySelectorAll("input");
        items.push({ name: inputs[0].value, qty: parseInt(inputs[1].value) });
    });
    try {
        await apiFetch("/requests", { method: "POST", body: JSON.stringify({ type, items }) });
        // Close modal
        const modalEl = document.getElementById("newRequestModal");
        if (modalEl) {
            const modal = window.bootstrap?.Modal?.getInstance(modalEl);
            modal?.hide();
        }
        // Reset form
        document.getElementById("newRequestForm").reset();
        document.getElementById("requestItemsContainer").innerHTML = `
            <div class="input-group mb-2 request-item">
                <input type="text"   class="form-control" placeholder="Item name" required>
                <input type="number" class="form-control" placeholder="Qty" value="1" min="1" style="max-width:80px;" required>
                <button type="button" class="btn btn-danger" onclick="removeRequestItem(this)">×</button>
            </div>
        `;
        showToast("Request submitted successfully!", "success");
        loadRequestsPage();
    }
    catch (err) {
        showToast(err.message, "danger");
    }
}
window.addRequestItem = addRequestItem;
window.removeRequestItem = removeRequestItem;
window.handleRequestSubmit = handleRequestSubmit;
// ============================================================
// Toast Notifications
// ============================================================
function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.style.cssText = "position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
        document.body.appendChild(container);
    }
    const colors = {
        success: "#198754", danger: "#dc3545", warning: "#ffc107", info: "#0dcaf0",
    };
    const textColor = type === "warning" ? "#000" : "#fff";
    const toast = document.createElement("div");
    toast.style.cssText = `
        background-color:${colors[type] ?? colors.info};color:${textColor};
        padding:12px 20px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,.2);
        font-size:14px;min-width:220px;max-width:320px;opacity:0;transition:opacity .3s ease;
    `;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => { toast.style.opacity = "1"; }));
    setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 3000);
}
window.showToast = showToast;
function confirmAction(message) {
    return window.confirm(message);
}
// ============================================================
// Initialization
// ============================================================
window.addEventListener("load", () => {
    // Restore session from sessionStorage (survives page reload but not tab close)
    const stored = sessionStorage.getItem("authUser");
    if (stored) {
        try {
            const user = JSON.parse(stored);
            setAuthState(user);
        }
        catch {
            sessionStorage.removeItem("authUser");
        }
    }
    else {
        setAuthState(null);
    }
    const hash = window.location.hash.substring(1);
    showPage(hash || "landing");
});
window.addEventListener("hashchange", () => {
    const hash = window.location.hash.substring(1);
    if (hash)
        showPage(hash);
});
