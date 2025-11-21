const bankStoreKey = "allInOneMoneyBank";
const employeeKey = "allInOneMoneyBank_employees";
const clientKey = "allInOneMoneyBank_clients";
const transactionKey = "allInOneMoneyBank_transactions";

const salaryMap = {
  Manager: 50000,
  "Assistant Manager": 45000,
  Casher: 25000,
  Officer: 25000,
  "Assistant Officer": 19000,
};

const otpBuffer = {
  employee: null,
  client: null,
};

const bankState = {
  name: "All in One Money Bank",
  admin: { id: "111111", password: "111111", name: "ArunChandran" },
  balance: 10_000_000_000,
};

let employees = JSON.parse(localStorage.getItem(employeeKey) ?? "[]");
let clients = JSON.parse(localStorage.getItem(clientKey) ?? "[]");
let transactions = JSON.parse(localStorage.getItem(transactionKey) ?? "[]");

localStorage.setItem(bankStoreKey, JSON.stringify(bankState));

const $ = (selector) => document.querySelector(selector);
const sessionKey = "allInOneMoneyBank_session";
const pageRole = document.body?.dataset?.page ?? "home";

const employeeIdField = $("#employeeId");
const clientIdField = $("#clientId");

const loginForm = $("#loginForm");
const loginStatus = $("#loginStatus");
const adminDashboard = $("#admin-dashboard");
const employeePanel = $("#employee-panel");
const clientPanel = $("#client-panel");
const bankBalanceBtn = $("#bankBalanceBtn");
const bankBalanceDisplay = $("#bankBalanceDisplay");
const employeeList = $("#employeeList");
const clientList = $("#clientList");

const employeeForm = $("#employeeForm");
const employeeSalaryField = $("#employeeSalary");
const employeePasswordField = $("#employeePassword");
const employeeResult = $("#employeeResult");
const employeeSummary = $("#employeeSummary");
const downloadEmployeePdfBtn = $("#downloadEmployeePdf");

const clientForm = $("#clientForm");
const clientResult = $("#clientResult");
const clientSummary = $("#clientSummary");
const downloadClientPdfBtn = $("#downloadClientPdf");

const employeeDashboard = $("#employee-dashboard");

const clientDashboard = $("#client-dashboard");

const clientDetailsView = $("#clientDetailsView");
const clientLookupForm = $("#clientLookupForm");
const clientUpdateForm = $("#clientUpdateForm");
const clientBalanceForm = $("#clientBalanceForm");
const clientBalanceDisplay = $("#clientBalanceDisplay");
const clientTransferMessage = $("#clientTransferMessage");
const clientToBankForm = $("#clientToBankForm");
const clientTransferForm = $("#clientTransferForm");

const clientDetailsSummary = $("#clientDetailsSummary");
const clientTransferStatus = $("#clientTransferStatus");
const statementResults = $("#statementResults");
const statementForm = $("#statementForm");
const downloadStatementPdfBtn = $("#downloadStatementPdf");

function setSession(session) {
  if (!session) return;
  localStorage.setItem(sessionKey, JSON.stringify(session));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(sessionKey));
  } catch (error) {
    console.error("Unable to parse session", error);
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(sessionKey);
}

function requireRole(role) {
  const session = getSession();
  if (!session || session.role !== role) {
    window.location.href = "index.html";
    return null;
  }
  return session;
}

const statementPeriods = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  halfyearly: 182,
  yearly: 365,
};

let currentEmployee = null;
let currentClient = null;
let currentRole = null;
let latestEmployee = null;
let latestClient = null;
let latestStatementLines = [];

function saveEmployees() {
  localStorage.setItem(employeeKey, JSON.stringify(employees));
}

function saveClients() {
  localStorage.setItem(clientKey, JSON.stringify(clients));
}

function saveTransactions() {
  localStorage.setItem(transactionKey, JSON.stringify(transactions));
}

function generateEmployeeId() {
  if (!employeeIdField) return "";
  const id = `EMP${(employees.length + 1).toString().padStart(4, "0")}`;
  employeeIdField.value = id;
  return id;
}

function generateClientId() {
  if (!clientIdField) return "";
  const id = `CLT${(clients.length + 1).toString().padStart(4, "0")}`;
  clientIdField.value = id;
  return id;
}

function generateDebitCardNumber() {
  const cardField = $("#clientDebitCard");
  if (!cardField) return "";
  let digits = "";
  while (digits.length < 16) {
    digits += Math.floor(Math.random() * 10);
  }
  cardField.value = digits;
  return digits;
}

function generatePin() {
  const pinField = $("#clientPin");
  if (!pinField) return "";
  const pin = Math.floor(10000 + Math.random() * 90000).toString();
  pinField.value = pin;
  return pin;
}

function generateEmployeePassword() {
  const pin = Math.floor(10000 + Math.random() * 90000).toString();
  if (employeePasswordField) {
    employeePasswordField.value = pin;
  }
  return pin;
}

function sendOtp(type, mobileFieldId) {
  const field = $(mobileFieldId);
  if (!field) return;
  const mobile = field.value.trim();
  if (!mobile) {
    alert("Enter mobile number first.");
    return;
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpBuffer[type] = otp;
  alert(`OTP sent to ${mobile} (demo OTP: ${otp})`);
}

function verifyOtp(type, inputValue) {
  return otpBuffer[type] && otpBuffer[type] === inputValue.trim();
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.readAsDataURL(file);
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function showElement(el) {
  if (!el) return;
  el.classList.remove("hidden");
}

function hideElement(el) {
  if (!el) return;
  el.classList.add("hidden");
}

function hideAllDashboards() {
  [adminDashboard, employeeDashboard, clientDashboard].forEach((panel) => {
    if (panel) hideElement(panel);
  });
}

function activateDashboard(role) {
  hideAllDashboards();
  if (role === "admin") {
    showElement(adminDashboard);
  } else if (role === "employee") {
    showElement(employeeDashboard);
  } else if (role === "client") {
    showElement(clientDashboard);
  }
  currentRole = role;
}

function setStatus(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  if (isError) {
    el.classList.add("error");
  } else {
    el.classList.remove("error");
  }
}

function buildEmployeeSummary(employee) {
  return `Employee ID: ${employee.id}
Name: ${employee.name}
Age: ${employee.age}
Address: ${employee.address}
Email: ${employee.email}
Aadhaar: ${employee.aadhaar}
Mobile: ${employee.mobile}
Position: ${employee.position}
Salary: ${formatCurrency(employee.salary)}
Login Password: ${employee.password}`;
}

function buildClientSummary(client) {
  return `Client ID: ${client.id}
Name: ${client.name}
Age: ${client.age}
DOB: ${client.dob}
Address: ${client.address}
Email: ${client.email}
Aadhaar: ${client.aadhaar}
Mobile: ${client.mobile}
Account Type: ${client.accountType}
PAN: ${client.pan}
Debit Card: ${client.debitCard}
Security PIN: ${client.pin}
Balance: ${formatCurrency(client.balance)}`;
}

function buildAppointmentLetter(employee) {
  return `ALL IN ONE MONEY BANK
Offer of Employment

Date: ${new Date().toLocaleDateString()}

Dear ${employee.name},

We are pleased to appoint you as ${employee.position} at All in One Money Bank.

Employee ID: ${employee.id}
Reporting To: Bank Head, Arun Chandran
Salary Package: ${formatCurrency(employee.salary)} (per month)

Your appointment is effective immediately. Kindly report to headquarters with original documents within 7 days.

Regards,
All in One Money Bank`;
}

function showPanel(panelId) {
  [employeePanel, clientPanel].forEach((panel) => hideElement(panel));
  const panel = document.getElementById(panelId);
  if (panel) {
    showElement(panel);
  }
}

function downloadPdf(title, lines) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(title, 10, 15);
  doc.setFontSize(11);
  const splitLines = doc.splitTextToSize(lines, 180);
  doc.text(splitLines, 10, 30);
  doc.save(`${title.replace(/\s+/g, "_").toLowerCase()}.pdf`);
}

function findClientById(id) {
  return clients.find((c) => c.id === id);
}

function recordTransaction(clientId, type, amount, description) {
  const entry = {
    id: crypto.randomUUID(),
    clientId,
    type,
    amount,
    description,
    date: new Date().toISOString(),
  };
  transactions.push(entry);
  saveTransactions();
  return entry;
}

function filterTransactions(clientId, period) {
  const days = statementPeriods[period] ?? 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return transactions.filter(
    (tx) => tx.clientId === clientId && new Date(tx.date) >= cutoff
  );
}

function renderStatementLines(list) {
  if (!list.length) {
    statementResults.textContent = "No transactions for this period.";
    latestStatementLines = [];
    return;
  }
  const lines = list.map(
    (tx) =>
      `${new Date(tx.date).toLocaleString()} | ${tx.type.toUpperCase()} | ${formatCurrency(
        tx.amount
      )} | ${tx.description}`
  );
  statementResults.innerHTML = `<ul>${lines
    .map((line) => `<li>${line}</li>`)
    .join("")}</ul>`;
  latestStatementLines = lines;
}

function renderEmployeeList() {
  if (!employeeList) return;
  if (!employees.length) {
    employeeList.innerHTML = '<p class="muted">No employees yet.</p>';
    return;
  }
  employeeList.innerHTML = employees
    .map(
      (emp) => `
        <div class="record-row">
          <div>
            <strong>${emp.name} (${emp.id})</strong>
            <p>${emp.position} · Salary ${formatCurrency(emp.salary)}</p>
            <p class="record-meta">Email: ${emp.email} · Mobile: ${emp.mobile}</p>
            <p class="record-meta">Login Password: ${emp.password}</p>
          </div>
          <div class="record-actions">
            <button class="btn secondary mini" data-view-employee="${emp.id}">View</button>
            <button class="btn primary mini" data-download-employee="${emp.id}">Appointment PDF</button>
          </div>
        </div>`
    )
    .join("");
}

function renderClientList() {
  if (!clientList) return;
  if (!clients.length) {
    clientList.innerHTML = '<p class="muted">No clients yet.</p>';
    return;
  }
  clientList.innerHTML = clients
    .map(
      (client) => `
        <div class="record-row">
          <div>
            <strong>${client.name} (${client.id})</strong>
            <p>${client.accountType} · Balance ${formatCurrency(
              client.balance
            )}</p>
            <p class="record-meta">Email: ${client.email} · Mobile: ${client.mobile}</p>
          </div>
          <div class="record-actions">
            <button class="btn secondary mini" data-view-client="${client.id}">View</button>
            <button class="btn primary mini" data-download-client="${client.id}">Details PDF</button>
          </div>
        </div>`
    )
    .join("");
}

function downloadEmployeePdf(employee) {
  const lines = `${buildEmployeeSummary(employee)}

${employee.appointmentLetter ?? buildAppointmentLetter(employee)}`;
  downloadPdf(`Employee_${employee.id}`, lines);
}

function downloadClientPdf(client) {
  downloadPdf(`Client_${client.id}`, buildClientSummary(client));
}

function refreshAutoFields() {
  generateEmployeeId();
  generateClientId();
  generateDebitCardNumber();
  generatePin();
  generateEmployeePassword();
}

// Unified login
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("#loginId").value.trim();
    const password = $("#loginPassword").value.trim();
    if (!id || !password) {
      setStatus(loginStatus, "Please enter both ID and password.", true);
      return;
    }

    if (id === bankState.admin.id) {
      if (password === bankState.admin.password) {
        setSession({ role: "admin", id });
        window.location.href = "admin.html";
      } else {
        setStatus(loginStatus, "Incorrect password for admin.", true);
      }
      return;
    }

    const employee = employees.find((emp) => emp.id === id);
    if (employee) {
      if (password === employee.password) {
        setSession({ role: "employee", id: employee.id });
        window.location.href = "employee.html";
      } else {
        setStatus(loginStatus, "Incorrect employee password.", true);
      }
      return;
    }

    const client = clients.find((c) => c.id === id);
    if (client) {
      if (password === client.pin) {
        setSession({ role: "client", id: client.id });
        window.location.href = "client.html";
      } else {
        setStatus(loginStatus, "Incorrect client PIN.", true);
      }
      return;
    }

    setStatus(loginStatus, "Account not found. Please check your ID.", true);
  });
}

// Admin buttons
document.querySelectorAll("[data-panel]").forEach((btn) => {
  btn.addEventListener("click", () => showPanel(btn.dataset.panel));
});

if (bankBalanceBtn) {
  bankBalanceBtn.addEventListener("click", () => {
    setStatus(
      bankBalanceDisplay,
      `Bank Own Account Balance: ${formatCurrency(bankState.balance)}`
    );
  });
}

// Employee form logic
const employeePositionSelect = $("#employeePosition");
if (employeePositionSelect) {
  employeePositionSelect.addEventListener("change", (event) => {
    const position = event.target.value;
    if (employeeSalaryField) {
      employeeSalaryField.value = position ? salaryMap[position] : "";
    }
  });
}

const sendEmployeeOtpBtn = $("#sendEmployeeOtp");
if (sendEmployeeOtpBtn) {
  sendEmployeeOtpBtn.addEventListener("click", () =>
    sendOtp("employee", "#employeeMobile")
  );
}

if (employeeForm) {
  employeeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const position = $("#employeePosition").value;
  const otpInput = $("#employeeOtp").value;
  if (!verifyOtp("employee", otpInput)) {
    alert("Invalid OTP. Please verify mobile number.");
    return;
  }
  const image = await fileToBase64($("#employeeImage").files[0]);
  const loginPassword =
    employeePasswordField?.value || generateEmployeePassword();
  const employee = {
    id: employeeIdField.value,
    position,
    salary: salaryMap[position],
    name: $("#employeeName").value,
    age: $("#employeeAge").value,
    address: $("#employeeAddress").value,
    email: $("#employeeEmail").value,
    aadhaar: $("#employeeAadhaar").value,
    mobile: $("#employeeMobile").value,
    password: loginPassword,
    image,
    appointmentLetter: buildAppointmentLetter({
      id: employeeIdField.value,
      name: $("#employeeName").value,
      position,
      salary: salaryMap[position],
    }),
    createdAt: new Date().toISOString(),
  };
  employees.push(employee);
  saveEmployees();
  latestEmployee = employee;
  renderEmployeeList();
  employeeSummary.textContent = `${buildEmployeeSummary(employee)}

Appointment Letter:
${employee.appointmentLetter}`;
  showElement(employeeResult);
  downloadEmployeePdf(employee);
  alert("Employee created successfully. Appointment letter downloaded.");
  employeeForm.reset();
  employeeSalaryField.value = "";
  otpBuffer.employee = null;
  refreshAutoFields();
});
}

if (downloadEmployeePdfBtn) {
  downloadEmployeePdfBtn.addEventListener("click", () => {
    if (!latestEmployee) return;
    downloadEmployeePdf(latestEmployee);
  });
}

// Client form logic
const sendClientOtpBtn = $("#sendClientOtp");
if (sendClientOtpBtn) {
  sendClientOtpBtn.addEventListener("click", () =>
    sendOtp("client", "#clientMobile")
  );
}

if (clientForm) {
  clientForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const otpInput = $("#clientOtp").value;
  if (!verifyOtp("client", otpInput)) {
    alert("Invalid OTP. Please verify client mobile.");
    return;
  }
  const image = await fileToBase64($("#clientImage").files[0]);
  const client = {
    id: clientIdField.value,
    accountType: $("#clientAccountType").value,
    name: $("#clientName").value,
    age: $("#clientAge").value,
    dob: $("#clientDob").value,
    address: $("#clientAddress").value,
    email: $("#clientEmail").value,
    aadhaar: $("#clientAadhaar").value,
    mobile: $("#clientMobile").value,
    pan: $("#clientPan").value,
    image,
    debitCard: $("#clientDebitCard").value,
    pin: $("#clientPin").value,
    balance: 0,
    createdAt: new Date().toISOString(),
  };
  clients.push(client);
  saveClients();
  latestClient = client;
  renderClientList();
  clientSummary.textContent = buildClientSummary(client);
  showElement(clientResult);
  alert("Client created successfully.");
  clientForm.reset();
  otpBuffer.client = null;
  refreshAutoFields();
});
}

if (downloadClientPdfBtn) {
  downloadClientPdfBtn.addEventListener("click", () => {
    if (!latestClient) return;
    downloadClientPdf(latestClient);
  });
}

employeeList?.addEventListener("click", (event) => {
  const button = event.target.closest(
    "button[data-view-employee], button[data-download-employee]"
  );
  if (!button) return;
  const id =
    button.getAttribute("data-view-employee") ??
    button.getAttribute("data-download-employee");
  const employee = employees.find((emp) => emp.id === id);
  if (!employee) return;
  if (button.hasAttribute("data-view-employee")) {
    alert(buildEmployeeSummary(employee));
  } else {
    downloadEmployeePdf(employee);
  }
});

clientList?.addEventListener("click", (event) => {
  const button = event.target.closest(
    "button[data-view-client], button[data-download-client]"
  );
  if (!button) return;
  const id =
    button.getAttribute("data-view-client") ??
    button.getAttribute("data-download-client");
  const client = clients.find((c) => c.id === id);
  if (!client) return;
  if (button.hasAttribute("data-view-client")) {
    alert(buildClientSummary(client));
  } else {
    downloadClientPdf(client);
  }
});

// Client lookup and updates (employee tools)
if (clientLookupForm) {
  clientLookupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("#lookupClientId").value.trim();
    const client = findClientById(id);
    if (!client) {
      if (clientDetailsView) {
        clientDetailsView.textContent = "Client not found.";
        showElement(clientDetailsView);
      }
      hideElement(clientUpdateForm);
      return;
    }
    if (clientDetailsView) {
      clientDetailsView.innerHTML = `<strong>${client.name}</strong><br/>${buildClientSummary(
        client
      ).replace(/\n/g, "<br/>")}`;
      showElement(clientDetailsView);
    }
    $("#updateClientName").value = client.name;
    $("#updateClientDob").value = client.dob;
    $("#updateClientAddress").value = client.address;
    $("#updateClientMobile").value = client.mobile;
    $("#updateClientEmail").value = client.email;
    $("#updateClientPin").value = client.pin;
    clientUpdateForm.dataset.clientId = client.id;
    showElement(clientUpdateForm);
  });
}

if (clientUpdateForm) {
  clientUpdateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const clientId = event.currentTarget.dataset.clientId;
    const client = findClientById(clientId);
    if (!client) return;
    client.name = $("#updateClientName").value;
    client.dob = $("#updateClientDob").value;
    client.address = $("#updateClientAddress").value;
    client.mobile = $("#updateClientMobile").value;
    client.email = $("#updateClientEmail").value;
    client.pin = $("#updateClientPin").value;
    const newImageFile = $("#updateClientImage").files[0];
    if (newImageFile) {
      client.image = await fileToBase64(newImageFile);
    }
    saveClients();
    alert("Client details updated.");
    if (clientDetailsView) {
      clientDetailsView.innerHTML = `<strong>${client.name}</strong><br/>${buildClientSummary(
        client
      ).replace(/\n/g, "<br/>")}`;
    }
    renderClientList();
  });
}

if (clientBalanceForm) {
  clientBalanceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("#balanceClientId").value.trim();
    const client = findClientById(id);
    if (!client) {
      setStatus(clientBalanceDisplay, "Client not found.", true);
      return;
    }
    setStatus(
      clientBalanceDisplay,
      `Client Balance: ${formatCurrency(client.balance)}`
    );
  });
}

if (clientToBankForm) {
  clientToBankForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const id = $("#transferClientId").value.trim();
    const amount = Number($("#transferAmount").value);
    const client = findClientById(id);
    if (!client) {
      setStatus(clientTransferMessage, "Client not found.", true);
      return;
    }
    if (amount <= 0 || amount > client.balance) {
      setStatus(clientTransferMessage, "Invalid amount.", true);
      return;
    }
    client.balance -= amount;
    bankState.balance += amount;
    saveClients();
    localStorage.setItem(bankStoreKey, JSON.stringify(bankState));
    recordTransaction(
      client.id,
      "debit",
      amount,
      "Transfer to bank own account"
    );
    setStatus(
      clientTransferMessage,
      `Transferred ${formatCurrency(amount)} to bank account.`
    );
    renderClientList();
  });
}

function renderClientDetails() {
  if (!currentClient || !clientDetailsSummary) return;
  clientDetailsSummary.innerHTML = buildClientSummary(currentClient).replace(
    /\n/g,
    "<br/>"
  );
}

document.querySelectorAll("[data-client-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-client-tab]").forEach((el) =>
      el.classList.remove("active")
    );
    btn.classList.add("active");
    document.querySelectorAll(".client-tab").forEach((tab) =>
      tab.classList.add("hidden")
    );
    const target = btn.dataset.clientTab;
    if (target === "details") {
      showElement($("#clientTabDetails"));
      renderClientDetails();
    } else if (target === "transfer") {
      showElement($("#clientTabTransfer"));
    } else {
      showElement($("#clientTabStatement"));
    }
  });
});

if (clientTransferForm) {
  clientTransferForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentClient) return;
    const targetId = $("#clientTransferTarget").value.trim();
    const amount = Number($("#clientTransferAmount").value);
    const pin = $("#clientTransferPin").value.trim();
    if (pin !== currentClient.pin) {
      setStatus(clientTransferStatus, "Incorrect PIN.", true);
      return;
    }
    if (targetId === currentClient.id) {
      setStatus(clientTransferStatus, "Cannot transfer to same account.", true);
      return;
    }
    const targetClient = findClientById(targetId);
    if (!targetClient) {
      setStatus(clientTransferStatus, "Receiving account not found.", true);
      return;
    }
    if (amount <= 0 || amount > currentClient.balance) {
      setStatus(clientTransferStatus, "Insufficient balance.", true);
      return;
    }
    currentClient.balance -= amount;
    targetClient.balance += amount;
    saveClients();
    recordTransaction(
      currentClient.id,
      "debit",
      amount,
      `Transfer to ${targetClient.id}`
    );
    recordTransaction(
      targetClient.id,
      "credit",
      amount,
      `Transfer from ${currentClient.id}`
    );
    setStatus(
      clientTransferStatus,
      `Transferred ${formatCurrency(amount)} to ${targetClient.name}.`
    );
    renderClientDetails();
    renderClientList();
  });
}

if (statementForm) {
  statementForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!currentClient) return;
    const period = $("#statementPeriod").value;
    const list = filterTransactions(currentClient.id, period);
    renderStatementLines(list);
  });
}

if (downloadStatementPdfBtn) {
  downloadStatementPdfBtn.addEventListener("click", () => {
    if (!currentClient) return;
    if (!latestStatementLines.length) {
      alert("View a statement first.");
      return;
    }
    downloadPdf(
      `${currentClient.id}_Statement`,
      latestStatementLines.join("\n")
    );
  });
}

function initializePageRole() {
  if (pageRole === "home") {
    hideAllDashboards();
    return;
  }
  const session = requireRole(pageRole);
  if (!session) return;
  if (pageRole === "admin") {
    renderEmployeeList();
    renderClientList();
    refreshAutoFields();
    showElement(adminDashboard);
  } else if (pageRole === "employee") {
    currentEmployee = employees.find((emp) => emp.id === session.id);
    if (!currentEmployee) {
      clearSession();
      window.location.href = "index.html";
      return;
    }
    refreshAutoFields();
    showElement(employeeDashboard);
  } else if (pageRole === "client") {
    currentClient = clients.find((c) => c.id === session.id);
    if (!currentClient) {
      clearSession();
      window.location.href = "index.html";
      return;
    }
    showElement(clientDashboard);
    renderClientDetails();
  }
}

initializePageRole();

