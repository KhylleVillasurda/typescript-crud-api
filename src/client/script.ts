// ============================================================
// Types
// ============================================================

interface AuthUser {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    token: string;
}

interface Account {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    verified: boolean;
}

interface Employee {
    id: number;
    userEmail: string;
    position: string;
    department: string;
    hireDate: string;
}

interface Department {
    id: number;
    name: string;
    description: string;
}

interface RequestItem {
    name: string;
    qty: number;
}

interface UserRequest {
    id: number;
    type: string;
    items: RequestItem[];
    status: string;
    createdAt: string;
    userEmail: string;
}

// ============================================================
// State
// ============================================================

let currentUser: AuthUser | null = null;

// ============================================================
// API Helper
// ============================================================

const API = "";  // same origin — server serves both API and frontend

async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (currentUser?.token) {
        headers["Authorization"] = `Bearer ${currentUser.token}`;
    }

    const res = await fetch(`${API}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || `Request failed (${res.status})`);
    }
    return data as T;
}

// ============================================================
// Page Navigation
// ============================================================

function showPage(pageName: string): void {
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

    document.querySelectorAll<HTMLElement>(".page").forEach((p) => {
        p.classList.remove("active");
    });

    const pageEl = document.getElementById(pageName + "Page");
    if (!pageEl) return;
    pageEl.classList.add("active");
    window.location.hash = pageName;

    // Trigger page-specific loads
    if (pageName === "profile" && currentUser) updateProfilePage();
    else if (pageName === "employees") loadEmployeesPage();
    else if (pageName === "departments") loadDepartmentsPage();
    else if (pageName === "accounts") loadAccountsPage();
    else if (pageName === "requests") loadRequestsPage();

    // Close mobile nav if open
    const nav = document.getElementById("navbarNav");
    if (nav?.classList.contains("show")) nav.classList.remove("show");
}

// Expose globally so inline onclick="" attributes work
(window as any).showPage = showPage;

// ============================================================
// Auth State
// ============================================================

function setAuthState(user: AuthUser | null): void {
    currentUser = user;
    const body = document.body;

    body.classList.remove("authenticated", "not-authenticated", "is-admin");

    if (user) {
        body.classList.add("authenticated");
        if (user.role === "Admin") body.classList.add("is-admin");

        const nameEl = document.getElementById("userDropdownName");
        if (nameEl) nameEl.textContent = user.firstName || user.email;

        sessionStorage.setItem("authUser", JSON.stringify(user));
    } else {
        body.classList.add("not-authenticated");
        sessionStorage.removeItem("authUser");
    }
}

// ============================================================
// Register
// ============================================================

async function handleRegister(event: Event): Promise<void> {
    event.preventDefault();

    const firstName       = (document.getElementById("fname") as HTMLInputElement).value.trim();
    const lastName        = (document.getElementById("lname") as HTMLInputElement).value.trim();
    const email           = (document.getElementById("regEmail") as HTMLInputElement).value.trim();
    const password        = (document.getElementById("regPassword") as HTMLInputElement).value;
    const confirmPassword = (document.getElementById("regConfirmPassword") as HTMLInputElement).value;

    try {
        const result = await apiFetch<{ message: string; verificationToken: string }>(
            "/users/register",
            {
                method: "POST",
                body: JSON.stringify({ firstName, lastName, email, password, confirmPassword }),
            }
        );

        // Store the token so the verify page can use it for the simulation button
        sessionStorage.setItem("pendingVerificationToken", result.verificationToken);
        sessionStorage.setItem("pendingVerificationEmail", email);

        const verifyEmailEl = document.getElementById("verifyEmail");
        if (verifyEmailEl) verifyEmailEl.textContent = email;

        showToast("Registration successful! Please verify your email.", "success");
        (document.getElementById("registerForm") as HTMLFormElement).reset();
        showPage("verify");
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

(window as any).handleRegister = handleRegister;

// ============================================================
// Verify Email (demo simulation)
// ============================================================

async function simulateVerification(): Promise<void> {
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
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

(window as any).simulateVerification = simulateVerification;

// ============================================================
// Login
// ============================================================

async function handleLogin(event: Event): Promise<void> {
    event.preventDefault();

    const email    = (document.getElementById("email") as HTMLInputElement).value.trim();
    const password = (document.getElementById("pwd") as HTMLInputElement).value;

    try {
        const user = await apiFetch<AuthUser>("/users/authenticate", {
            method: "POST",
            body: JSON.stringify({ email, password }),
        });

        setAuthState(user);
        showToast(`Welcome back, ${user.firstName}!`, "success");
        (document.getElementById("loginForm") as HTMLFormElement).reset();
        showPage("profile");
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

(window as any).handleLogin = handleLogin;

// ============================================================
// Logout
// ============================================================

function logout(): void {
    setAuthState(null);
    showToast("Logged out successfully.", "success");
    showPage("landing");
}

(window as any).logout = logout;

// ============================================================
// Profile Page
// ============================================================

function updateProfilePage(): void {
    if (!currentUser) return;
    const el = (id: string) => document.getElementById(id);
    const nameEl = el("profileName");  if (nameEl) nameEl.textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    const emailEl = el("profileEmail"); if (emailEl) emailEl.textContent = currentUser.email;
    const roleEl  = el("profileRole");  if (roleEl)  roleEl.textContent  = currentUser.role;
}

// ============================================================
// Employees Page
// ============================================================

async function loadEmployeesPage(): Promise<void> {
    try {
        const employees = await apiFetch<Employee[]>("/employees");
        renderEmployeesTable(employees);
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

function renderEmployeesTable(employees: Employee[]): void {
    const tbody = document.getElementById("employeeTableBody");
    if (!tbody) return;

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

function showAddEmployeeForm(): void {
    document.getElementById("employeeFormContainer")!.style.display = "block";
    document.getElementById("employeeTableContainer")!.style.display = "none";
    document.getElementById("employeeFormTitle")!.textContent = "Add Employee";
    (document.getElementById("employeeForm") as HTMLFormElement).reset();
    delete (document.getElementById("employeeForm") as any).dataset.editingId;
    (document.getElementById("empId") as HTMLInputElement).readOnly = false;
}

function hideEmployeeForm(): void {
    document.getElementById("employeeFormContainer")!.style.display = "none";
    document.getElementById("employeeTableContainer")!.style.display = "block";
}

async function editEmployee(id: number): Promise<void> {
    try {
        const emp = await apiFetch<Employee>(`/employees/${id}`);

        document.getElementById("employeeFormContainer")!.style.display = "block";
        document.getElementById("employeeTableContainer")!.style.display = "none";
        document.getElementById("employeeFormTitle")!.textContent = "Edit Employee";

        (document.getElementById("empId")       as HTMLInputElement).value = String(emp.id);
        (document.getElementById("empId")       as HTMLInputElement).readOnly = true;
        (document.getElementById("empEmail")    as HTMLInputElement).value = emp.userEmail;
        (document.getElementById("empPosition") as HTMLInputElement).value = emp.position;
        (document.getElementById("empDept")     as HTMLSelectElement).value = emp.department;
        (document.getElementById("empHireDate") as HTMLInputElement).value = emp.hireDate;

        (document.getElementById("employeeForm") as any).dataset.editingId = emp.id;
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

async function handleEmployeeSave(event: Event): Promise<void> {
    event.preventDefault();

    const editingId = (document.getElementById("employeeForm") as any).dataset.editingId;
    const payload = {
        userEmail:  (document.getElementById("empEmail")    as HTMLInputElement).value.trim(),
        position:   (document.getElementById("empPosition") as HTMLInputElement).value.trim(),
        department: (document.getElementById("empDept")     as HTMLSelectElement).value,
        hireDate:   (document.getElementById("empHireDate") as HTMLInputElement).value,
    };

    try {
        if (editingId) {
            await apiFetch(`/employees/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
            showToast("Employee updated.", "success");
        } else {
            await apiFetch("/employees", { method: "POST", body: JSON.stringify(payload) });
            showToast("Employee added.", "success");
        }
        hideEmployeeForm();
        loadEmployeesPage();
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

async function deleteEmployee(id: number): Promise<void> {
    if (!confirmAction("Are you sure you want to delete this employee?")) return;
    try {
        await apiFetch(`/employees/${id}`, { method: "DELETE" });
        showToast("Employee deleted.", "success");
        loadEmployeesPage();
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

(window as any).showAddEmployeeForm = showAddEmployeeForm;
(window as any).hideEmployeeForm    = hideEmployeeForm;
(window as any).editEmployee        = editEmployee;
(window as any).handleEmployeeSave  = handleEmployeeSave;
(window as any).deleteEmployee      = deleteEmployee;

// ============================================================
// Departments Page
// ============================================================

async function loadDepartmentsPage(): Promise<void> {
    try {
        const departments = await apiFetch<Department[]>("/departments");
        renderDepartmentsTable(departments);
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

function renderDepartmentsTable(departments: Department[]): void {
    const tbody = document.getElementById("departmentTableBody");
    if (!tbody) return;

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

function showAddDepartmentForm(): void {
    document.getElementById("departmentFormContainer")!.style.display = "block";
    document.getElementById("departmentTableContainer")!.style.display = "none";
    document.getElementById("departmentFormTitle")!.textContent = "Add Department";
    (document.getElementById("departmentForm") as HTMLFormElement).reset();
    delete (document.getElementById("departmentForm") as any).dataset.editingId;
}

function hideDepartmentForm(): void {
    document.getElementById("departmentFormContainer")!.style.display = "none";
    document.getElementById("departmentTableContainer")!.style.display = "block";
}

async function editDepartment(id: number): Promise<void> {
    try {
        const dept = await apiFetch<Department>(`/departments/${id}`);

        document.getElementById("departmentFormContainer")!.style.display = "block";
        document.getElementById("departmentTableContainer")!.style.display = "none";
        document.getElementById("departmentFormTitle")!.textContent = "Edit Department";

        (document.getElementById("deptName") as HTMLInputElement).value = dept.name;
        (document.getElementById("deptDesc") as HTMLTextAreaElement).value = dept.description;

        (document.getElementById("departmentForm") as any).dataset.editingId = dept.id;
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

async function handleDepartmentSave(event: Event): Promise<void> {
    event.preventDefault();

    const editingId = (document.getElementById("departmentForm") as any).dataset.editingId;
    const payload = {
        name:        (document.getElementById("deptName") as HTMLInputElement).value.trim(),
        description: (document.getElementById("deptDesc") as HTMLTextAreaElement).value.trim(),
    };

    try {
        if (editingId) {
            await apiFetch(`/departments/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
            showToast("Department updated.", "success");
        } else {
            await apiFetch("/departments", { method: "POST", body: JSON.stringify(payload) });
            showToast("Department added.", "success");
        }
        hideDepartmentForm();
        loadDepartmentsPage();
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

async function deleteDepartment(id: number): Promise<void> {
    if (!confirmAction("Are you sure you want to delete this department?")) return;
    try {
        await apiFetch(`/departments/${id}`, { method: "DELETE" });
        showToast("Department deleted.", "success");
        loadDepartmentsPage();
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

(window as any).showAddDepartmentForm = showAddDepartmentForm;
(window as any).hideDepartmentForm    = hideDepartmentForm;
(window as any).editDepartment        = editDepartment;
(window as any).handleDepartmentSave  = handleDepartmentSave;
(window as any).deleteDepartment      = deleteDepartment;

// ============================================================
// Accounts Page (Admin)
// ============================================================

async function loadAccountsPage(): Promise<void> {
    try {
        const accounts = await apiFetch<Account[]>("/users");
        renderAccountsTable(accounts);
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

function renderAccountsTable(accounts: Account[]): void {
    const tbody = document.getElementById("accountTableBody");
    if (!tbody) return;

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

function showAddAccountForm(): void {
    document.getElementById("accountFormContainer")!.style.display = "block";
    document.getElementById("accountTableContainer")!.style.display = "none";
    document.getElementById("accountFormTitle")!.textContent = "Add Account";
    (document.getElementById("accountForm") as HTMLFormElement).reset();
    (document.getElementById("accEmail") as HTMLInputElement).readOnly = false;
    delete (document.getElementById("accountForm") as any).dataset.editingId;
    // Show confirm-password field for new accounts
    const cpWrap = document.getElementById("accConfirmPasswordWrap");
    if (cpWrap) cpWrap.style.display = "block";
}

function hideAccountForm(): void {
    document.getElementById("accountFormContainer")!.style.display = "none";
    document.getElementById("accountTableContainer")!.style.display = "block";
}

async function editAccount(id: number): Promise<void> {
    try {
        const acc = await apiFetch<Account>(`/users/${id}`);

        document.getElementById("accountFormContainer")!.style.display = "block";
        document.getElementById("accountTableContainer")!.style.display = "none";
        document.getElementById("accountFormTitle")!.textContent = "Edit Account";

        (document.getElementById("accFirstName") as HTMLInputElement).value = acc.firstName;
        (document.getElementById("accLastName")  as HTMLInputElement).value = acc.lastName;
        (document.getElementById("accEmail")     as HTMLInputElement).value = acc.email;
        (document.getElementById("accEmail")     as HTMLInputElement).readOnly = true;
        (document.getElementById("accRole")      as HTMLSelectElement).value = acc.role;
        (document.getElementById("accVerified")  as HTMLInputElement).checked = acc.verified;
        (document.getElementById("accPassword")  as HTMLInputElement).value = "";

        // Hide confirm-password field in edit mode (password change is optional)
        const cpWrap = document.getElementById("accConfirmPasswordWrap");
        if (cpWrap) cpWrap.style.display = "none";

        (document.getElementById("accountForm") as any).dataset.editingId = id;
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

async function handleAccountSave(event: Event): Promise<void> {
    event.preventDefault();

    const editingId = (document.getElementById("accountForm") as any).dataset.editingId;
    const password  = (document.getElementById("accPassword") as HTMLInputElement).value;

    const payload: Record<string, unknown> = {
        firstName: (document.getElementById("accFirstName") as HTMLInputElement).value.trim(),
        lastName:  (document.getElementById("accLastName")  as HTMLInputElement).value.trim(),
        email:     (document.getElementById("accEmail")     as HTMLInputElement).value.trim(),
        role:      (document.getElementById("accRole")      as HTMLSelectElement).value,
        verified:  (document.getElementById("accVerified")  as HTMLInputElement).checked,
    };

    if (password) {
        payload.password = password;
        payload.confirmPassword = (document.getElementById("accConfirmPassword") as HTMLInputElement)?.value ?? password;
    }

    try {
        if (editingId) {
            await apiFetch(`/users/${editingId}`, { method: "PUT", body: JSON.stringify(payload) });
            showToast("Account updated.", "success");
        } else {
            await apiFetch("/users", { method: "POST", body: JSON.stringify(payload) });
            showToast("Account created.", "success");
        }
        hideAccountForm();
        loadAccountsPage();
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

async function resetPassword(id: number): Promise<void> {
    const newPassword = prompt("Enter new password (min 6 characters):");
    if (!newPassword) return;
    if (newPassword.length < 6) { showToast("Password must be at least 6 characters!", "warning"); return; }

    try {
        await apiFetch(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify({ password: newPassword, confirmPassword: newPassword }),
        });
        showToast("Password reset successfully!", "success");
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

async function deleteAccount(id: number): Promise<void> {
    if (currentUser?.id === id) { showToast("You cannot delete your own account!", "danger"); return; }
    if (!confirmAction("Are you sure you want to delete this account?")) return;

    try {
        await apiFetch(`/users/${id}`, { method: "DELETE" });
        showToast("Account deleted.", "success");
        loadAccountsPage();
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

(window as any).showAddAccountForm = showAddAccountForm;
(window as any).hideAccountForm    = hideAccountForm;
(window as any).editAccount        = editAccount;
(window as any).handleAccountSave  = handleAccountSave;
(window as any).resetPassword      = resetPassword;
(window as any).deleteAccount      = deleteAccount;

// ============================================================
// Requests Page
// ============================================================

async function loadRequestsPage(): Promise<void> {
    try {
        const reqs = await apiFetch<UserRequest[]>("/requests");
        renderRequestsTable(reqs);
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

function renderRequestsTable(reqs: UserRequest[]): void {
    const container = document.getElementById("requestsContainer")!;
    const table     = document.getElementById("requestsTable")!;
    const tbody     = document.getElementById("requestsTableBody")!;

    if (reqs.length === 0) {
        container.style.display = "block";
        table.style.display = "none";
        return;
    }

    container.style.display = "none";
    table.style.display = "table";

    const badgeMap: Record<string, string> = {
        Pending:  "warning text-dark",
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

function addRequestItem(): void {
    const container = document.getElementById("requestItemsContainer")!;
    const div = document.createElement("div");
    div.className = "input-group mb-2 request-item";
    div.innerHTML = `
        <input type="text"   class="form-control" placeholder="Item name" required>
        <input type="number" class="form-control" placeholder="Qty" value="1" min="1" style="max-width:80px;" required>
        <button type="button" class="btn btn-danger" onclick="removeRequestItem(this)">×</button>
    `;
    container.appendChild(div);
}

function removeRequestItem(button: HTMLButtonElement): void {
    const container = document.getElementById("requestItemsContainer")!;
    if (container.children.length > 1) {
        button.closest<HTMLElement>(".request-item")!.remove();
    } else {
        showToast("You must have at least one item!", "warning");
    }
}

async function handleRequestSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!currentUser) { showToast("Please log in first!", "warning"); return; }

    const type  = (document.getElementById("requestType") as HTMLSelectElement).value;
    const items: RequestItem[] = [];

    document.querySelectorAll<HTMLElement>(".request-item").forEach((row) => {
        const inputs = row.querySelectorAll<HTMLInputElement>("input");
        items.push({ name: inputs[0].value, qty: parseInt(inputs[1].value) });
    });

    try {
        await apiFetch("/requests", { method: "POST", body: JSON.stringify({ type, items }) });

        // Close modal
        const modalEl = document.getElementById("newRequestModal");
        if (modalEl) {
            const modal = (window as any).bootstrap?.Modal?.getInstance(modalEl);
            modal?.hide();
        }

        // Reset form
        (document.getElementById("newRequestForm") as HTMLFormElement).reset();
        document.getElementById("requestItemsContainer")!.innerHTML = `
            <div class="input-group mb-2 request-item">
                <input type="text"   class="form-control" placeholder="Item name" required>
                <input type="number" class="form-control" placeholder="Qty" value="1" min="1" style="max-width:80px;" required>
                <button type="button" class="btn btn-danger" onclick="removeRequestItem(this)">×</button>
            </div>
        `;

        showToast("Request submitted successfully!", "success");
        loadRequestsPage();
    } catch (err: any) {
        showToast(err.message, "danger");
    }
}

(window as any).addRequestItem       = addRequestItem;
(window as any).removeRequestItem    = removeRequestItem;
(window as any).handleRequestSubmit  = handleRequestSubmit;

// ============================================================
// Toast Notifications
// ============================================================

function showToast(message: string, type: "success" | "danger" | "warning" | "info" = "success"): void {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.style.cssText = "position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;";
        document.body.appendChild(container);
    }

    const colors: Record<string, string> = {
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

(window as any).showToast = showToast;

function confirmAction(message: string): boolean {
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
            const user: AuthUser = JSON.parse(stored);
            setAuthState(user);
        } catch {
            sessionStorage.removeItem("authUser");
        }
    } else {
        setAuthState(null);
    }

    const hash = window.location.hash.substring(1);
    showPage(hash || "landing");
});

window.addEventListener("hashchange", () => {
    const hash = window.location.hash.substring(1);
    if (hash) showPage(hash);
});
