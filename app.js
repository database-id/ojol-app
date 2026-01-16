// ==================== GOOGLE SHEETS API ====================
const API_URL = 'https://script.google.com/macros/s/AKfycbwFg1stRNb0i0wFlNZf8VLY_UJZ_WkCl9OyM2-apGU3G5QVBOA4VWM68CabbWvRZ7Zyqw/exec';

// LocalStorage Keys (for caching and session)
const STORAGE_KEYS = {
    CURRENT_USER: 'ojol_current_user',
    CACHED_INCOME: 'ojol_cached_income',
    CACHED_EXPENSE: 'ojol_cached_expense',
    CACHED_TARGET: 'ojol_cached_target'
};

// In-memory data
let incomeData = [];
let expenseData = [];
let targetData = {
    weekday: 30000,
    weekend: 70000,
    weekly: 290000,
    monthly: 1160000
};

// ==================== API HELPER ====================
async function apiCall(action, params = {}) {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    Object.keys(params).forEach(key => {
        // Only append if value is not undefined or null
        if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, params[key]);
        }
    });

    try {
        const response = await fetch(url.toString());
        const text = await response.text();

        // Check if response is valid
        if (!text || text === 'undefined' || text.trim() === '') {
            throw new Error('Empty or invalid response from server');
        }

        const data = JSON.parse(text);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        console.error('Response text:', error.responseText);
        showToast('Failed to save: ' + error.message, 'error');
        return { success: false, error: error.message };
    }
}

// ==================== LOADING OVERLAY ====================
function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const text = document.getElementById('loadingText');
    if (overlay) {
        if (text) text.textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ==================== LOGIN SYSTEM ====================
function getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.CACHED_INCOME);
    localStorage.removeItem(STORAGE_KEYS.CACHED_EXPENSE);
    localStorage.removeItem(STORAGE_KEYS.CACHED_TARGET);
}

// Check if user is logged in
function checkLogin() {
    const user = getCurrentUser();
    if (user) {
        showApp();
        loadAllData();
    } else {
        showLogin();
    }
}

// Show login page
function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('appContainer').style.display = 'none';
}

// Show main app
function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
}

// Show register form
function showRegister() {
    document.getElementById('loginFormContainer').style.display = 'none';
    document.getElementById('registerFormContainer').style.display = 'block';
}

// Show login form
function showLoginForm() {
    document.getElementById('registerFormContainer').style.display = 'none';
    document.getElementById('loginFormContainer').style.display = 'block';
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');

    if (!username || !password) {
        errorEl.textContent = 'Please fill all fields';
        return;
    }

    showLoading('Logging in...');

    const result = await apiCall('login', { username, password });

    hideLoading();

    if (result.success) {
        setCurrentUser(result.user);
        errorEl.textContent = '';
        showApp();
        loadAllData();
        showToast('Login successful!', 'success');
    } else {
        errorEl.textContent = result.error || 'Login failed';
    }
}

// Handle register
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorEl = document.getElementById('registerError');

    if (!username || !password) {
        errorEl.textContent = 'Please fill all fields';
        return;
    }

    if (password !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match';
        return;
    }

    if (password.length < 4) {
        errorEl.textContent = 'Password must be at least 4 characters';
        return;
    }

    showLoading('Creating account...');

    const result = await apiCall('register', { username, password });

    hideLoading();

    if (result.success) {
        errorEl.textContent = '';
        showToast('Registration successful! Please login.', 'success');
        showLoginForm();
        document.getElementById('loginUsername').value = username;
    } else {
        errorEl.textContent = result.error || 'Registration failed';
    }
}

// Handle logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        clearCurrentUser();
        incomeData = [];
        expenseData = [];
        showLogin();
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        showToast('Logged out successfully', 'success');
    }
}

// ==================== LOAD ALL DATA ====================
async function loadAllData() {
    const user = getCurrentUser();
    if (!user) return;

    showLoading('Loading data...');

    try {
        // Load from cache first for instant display
        const cachedIncome = localStorage.getItem(STORAGE_KEYS.CACHED_INCOME);
        const cachedExpense = localStorage.getItem(STORAGE_KEYS.CACHED_EXPENSE);
        const cachedTarget = localStorage.getItem(STORAGE_KEYS.CACHED_TARGET);

        if (cachedIncome) incomeData = JSON.parse(cachedIncome);
        if (cachedExpense) expenseData = JSON.parse(cachedExpense);
        if (cachedTarget) targetData = JSON.parse(cachedTarget);

        // Initialize filters and update UI with cached data
        initFilters();
        updateDashboard();

        // Load fresh data from API
        const [incomeResult, expenseResult, targetResult] = await Promise.all([
            apiCall('getIncome', { username: user.username }),
            apiCall('getExpense', { username: user.username }),
            apiCall('getTarget', { username: user.username })
        ]);

        if (incomeResult.success) {
            incomeData = incomeResult.income || [];
            localStorage.setItem(STORAGE_KEYS.CACHED_INCOME, JSON.stringify(incomeData));
        }

        if (expenseResult.success) {
            expenseData = expenseResult.expense || [];
            localStorage.setItem(STORAGE_KEYS.CACHED_EXPENSE, JSON.stringify(expenseData));
        }

        if (targetResult.success && targetResult.target) {
            targetData = targetResult.target;
            localStorage.setItem(STORAGE_KEYS.CACHED_TARGET, JSON.stringify(targetData));
        }

        // Update UI with fresh data
        updateDashboard();

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Error loading data', 'error');
    }

    hideLoading();
}

// ==================== UTILITY FUNCTIONS ====================
function formatRupiah(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}

function getWeekRange() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
    };
}

function getMonthRange(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
    };
}

// ==================== INCOME FUNCTIONS ====================
function getIncome() {
    return incomeData;
}

function getIncomeByDate(date) {
    return incomeData.filter(i => i.date === date);
}

function getIncomeByDateRange(startDate, endDate) {
    return incomeData.filter(i => i.date >= startDate && i.date <= endDate);
}

function getIncomeByMonth(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return incomeData.filter(i => i.date.startsWith(monthStr));
}

async function addIncome(income) {
    const user = getCurrentUser();
    if (!user) return;

    // Ensure all fields are defined
    const cleanIncome = {
        id: Date.now(),
        platform: income.platform || 'gojek',
        date: income.date || getToday(),
        amount: parseInt(income.amount) || 0,
        orders: parseInt(income.orders) || 0,
        bonus: parseInt(income.bonus) || 0,
        note: income.note || '',
        createdAt: new Date().toISOString()
    };

    showLoading('Saving...');

    const result = await apiCall('addIncome', {
        username: user.username,
        income: JSON.stringify(cleanIncome)
    });

    hideLoading();

    if (result.success) {
        incomeData.push(cleanIncome);
        localStorage.setItem(STORAGE_KEYS.CACHED_INCOME, JSON.stringify(incomeData));
        return cleanIncome;
    } else {
        showToast('Failed to save income', 'error');
        return null;
    }
}

async function updateIncome(id, data) {
    const user = getCurrentUser();
    if (!user) return;

    const index = incomeData.findIndex(i => i.id === id);
    if (index !== -1) {
        incomeData[index] = { ...incomeData[index], ...data };
        localStorage.setItem(STORAGE_KEYS.CACHED_INCOME, JSON.stringify(incomeData));

        // Sync to cloud (delete old, add new)
        await apiCall('deleteIncome', { username: user.username, incomeId: id });
        await apiCall('addIncome', {
            username: user.username,
            income: JSON.stringify(incomeData[index])
        });
    }
}

async function deleteIncome(id) {
    const user = getCurrentUser();
    if (!user) return;

    showLoading('Deleting...');

    const result = await apiCall('deleteIncome', {
        username: user.username,
        incomeId: id
    });

    hideLoading();

    if (result.success) {
        incomeData = incomeData.filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEYS.CACHED_INCOME, JSON.stringify(incomeData));
    } else {
        showToast('Failed to delete', 'error');
    }
}

// ==================== EXPENSE FUNCTIONS ====================
function getExpense() {
    return expenseData;
}

function getExpenseByDate(date) {
    return expenseData.filter(e => e.date === date);
}

function getExpenseByDateRange(startDate, endDate) {
    return expenseData.filter(e => e.date >= startDate && e.date <= endDate);
}

function getExpenseByMonth(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return expenseData.filter(e => e.date.startsWith(monthStr));
}

async function addExpense(expense) {
    const user = getCurrentUser();
    if (!user) return;

    // Ensure all fields are defined
    const cleanExpense = {
        id: Date.now(),
        category: expense.category || 'lainnya',
        date: expense.date || getToday(),
        amount: parseInt(expense.amount) || 0,
        note: expense.note || '',
        createdAt: new Date().toISOString()
    };

    showLoading('Saving...');

    const result = await apiCall('addExpense', {
        username: user.username,
        expense: JSON.stringify(cleanExpense)
    });

    hideLoading();

    if (result.success) {
        expenseData.push(cleanExpense);
        localStorage.setItem(STORAGE_KEYS.CACHED_EXPENSE, JSON.stringify(expenseData));
        return cleanExpense;
    } else {
        showToast('Failed to save expense', 'error');
        return null;
    }
}

async function updateExpense(id, data) {
    const user = getCurrentUser();
    if (!user) return;

    const index = expenseData.findIndex(e => e.id === id);
    if (index !== -1) {
        expenseData[index] = { ...expenseData[index], ...data };
        localStorage.setItem(STORAGE_KEYS.CACHED_EXPENSE, JSON.stringify(expenseData));

        // Sync to cloud
        await apiCall('deleteExpense', { username: user.username, expenseId: id });
        await apiCall('addExpense', {
            username: user.username,
            expense: JSON.stringify(expenseData[index])
        });
    }
}

async function deleteExpense(id) {
    const user = getCurrentUser();
    if (!user) return;

    showLoading('Deleting...');

    const result = await apiCall('deleteExpense', {
        username: user.username,
        expenseId: id
    });

    hideLoading();

    if (result.success) {
        expenseData = expenseData.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEYS.CACHED_EXPENSE, JSON.stringify(expenseData));
    } else {
        showToast('Failed to delete', 'error');
    }
}

// ==================== TARGET FUNCTIONS ====================
function getTarget() {
    return targetData;
}

async function saveTarget(target) {
    const user = getCurrentUser();
    if (!user) return;

    showLoading('Saving target...');

    const result = await apiCall('saveTarget', {
        username: user.username,
        target: JSON.stringify(target)
    });

    hideLoading();

    if (result.success) {
        targetData = target;
        localStorage.setItem(STORAGE_KEYS.CACHED_TARGET, JSON.stringify(targetData));
        return true;
    } else {
        showToast('Failed to save target', 'error');
        return false;
    }
}

// Get daily target based on day of week
function getDailyTarget(dateStr) {
    const target = getTarget();
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return target.weekend;
    }
    return target.weekday;
}

// Check if date is weekend
function isWeekend(dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
}

// Auto-calculate weekly and monthly targets
function autoCalculateTargets() {
    const weekday = parseInt(document.getElementById('targetWeekday').value) || 0;
    const weekend = parseInt(document.getElementById('targetWeekend').value) || 0;
    const weeklyTarget = (weekday * 5) + (weekend * 2);
    document.getElementById('targetWeekly').value = weeklyTarget;
    const monthlyTarget = weeklyTarget * 4;
    document.getElementById('targetMonthly').value = monthlyTarget;
}

// ==================== SUMMARY CALCULATIONS ====================
function calculateSummary(incomes, expenses) {
    const gojekData = incomes.filter(i => i.platform === 'gojek');
    const grabData = incomes.filter(i => i.platform === 'grab');

    const gojekTotal = gojekData.reduce((sum, i) => sum + i.amount + (i.bonus || 0), 0);
    const gojekOrders = gojekData.reduce((sum, i) => sum + i.orders, 0);
    const gojekBonus = gojekData.reduce((sum, i) => sum + (i.bonus || 0), 0);

    const grabTotal = grabData.reduce((sum, i) => sum + i.amount + (i.bonus || 0), 0);
    const grabOrders = grabData.reduce((sum, i) => sum + i.orders, 0);
    const grabBonus = grabData.reduce((sum, i) => sum + (i.bonus || 0), 0);

    const totalIncome = gojekTotal + grabTotal;
    const totalOrders = gojekOrders + grabOrders;
    const totalBonus = gojekBonus + grabBonus;
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalIncome - totalExpense;

    return {
        gojek: { total: gojekTotal, orders: gojekOrders, bonus: gojekBonus },
        grab: { total: grabTotal, orders: grabOrders, bonus: grabBonus },
        totalIncome,
        totalOrders,
        totalBonus,
        totalExpense,
        netIncome
    };
}

// ==================== MOBILE MENU ====================
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobileOverlay');
    if (sidebar && overlay) {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
    }
}

// Auto-hide mobile menu button on scroll
let lastScrollTop = 0;
let scrollTimeout;

function handleMobileMenuScroll() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (!menuBtn || window.innerWidth > 768) return;

    // Don't hide if sidebar is open
    if (sidebar && sidebar.classList.contains('show')) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    clearTimeout(scrollTimeout);

    if (scrollTop > lastScrollTop && scrollTop > 50) {
        // Scrolling down & past 50px - hide button
        menuBtn.classList.add('hide');
    } else {
        // Scrolling up - show button
        menuBtn.classList.remove('hide');
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;

    // Show button again after 2 seconds of no scrolling
    scrollTimeout = setTimeout(() => {
        menuBtn.classList.remove('hide');
    }, 2000);
}

// Add scroll listener for mobile menu
if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleMobileMenuScroll);
}

// ==================== UI NAVIGATION ====================
function switchPage(pageName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    document.getElementById(`${pageName}Section`).style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });

    // Close mobile menu after navigation
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('mobileOverlay');
        if (sidebar && overlay && sidebar.classList.contains('show')) {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        }
    }

    if (pageName === 'dashboard') updateDashboard();
    else if (pageName === 'pendapatan') loadIncomeList();
    else if (pageName === 'pengeluaran') loadExpenseList();
    else if (pageName === 'target') loadTargetPage();
}

// ==================== DASHBOARD ====================
let selectedDate = getToday();
let currentDashboardView = 'daily';
let selectedMonth = new Date().getMonth() + 1;
let selectedYear = new Date().getFullYear();

function openDatePicker() {
    document.getElementById('dashboardDate').showPicker();
}

function switchDashboardView(view) {
    currentDashboardView = view;

    document.querySelectorAll('.period-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.view === view) {
            tab.classList.add('active');
        }
    });

    const dateNav = document.getElementById('dateNavigator');
    const monthNav = document.getElementById('monthNavigator');

    if (view === 'daily') {
        dateNav.style.display = 'flex';
        monthNav.style.display = 'none';
    } else if (view === 'weekly') {
        dateNav.style.display = 'flex';
        monthNav.style.display = 'none';
    } else if (view === 'monthly') {
        dateNav.style.display = 'none';
        monthNav.style.display = 'flex';
    }

    updateDashboard();
}

function navigateMonth(offset) {
    selectedMonth += offset;
    if (selectedMonth > 12) {
        selectedMonth = 1;
        selectedYear++;
    } else if (selectedMonth < 1) {
        selectedMonth = 12;
        selectedYear--;
    }
    updateDashboard();
}

function updateDashboard() {
    document.getElementById('dashboardDate').value = selectedDate;

    let summary, target, targetLabel;

    if (currentDashboardView === 'daily') {
        document.getElementById('currentDate').textContent = formatDate(selectedDate);
        const dayIncomes = getIncomeByDate(selectedDate);
        const dayExpenses = getExpenseByDate(selectedDate);
        summary = calculateSummary(dayIncomes, dayExpenses);
        target = getDailyTarget(selectedDate);
        targetLabel = isWeekend(selectedDate) ? 'Weekend Target' : 'Weekday Target';
    } else if (currentDashboardView === 'weekly') {
        const weekRange = getWeekRangeFromDate(selectedDate);
        document.getElementById('currentDate').textContent = `${formatDateShort(weekRange.start)} - ${formatDateShort(weekRange.end)}`;
        const weekIncomes = getIncomeByDateRange(weekRange.start, weekRange.end);
        const weekExpenses = getExpenseByDateRange(weekRange.start, weekRange.end);
        summary = calculateSummary(weekIncomes, weekExpenses);
        target = getTarget().weekly;
        targetLabel = 'Weekly Target';
    } else if (currentDashboardView === 'monthly') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('monthLabel').textContent = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

        const monthRange = getMonthRange(selectedYear, selectedMonth);
        const monthIncomes = getIncomeByDateRange(monthRange.start, monthRange.end);
        const monthExpenses = getExpenseByDateRange(monthRange.start, monthRange.end);
        summary = calculateSummary(monthIncomes, monthExpenses);
        target = getTarget().monthly;
        targetLabel = 'Monthly Target';
    }

    document.getElementById('summaryGojek').textContent = formatRupiah(summary.gojek.total);
    document.getElementById('summaryGrab').textContent = formatRupiah(summary.grab.total);

    updateIncomeChart(summary, target);
}

function updateIncomeChart(summary, target) {
    const totalIncome = summary.totalIncome;

    const pct = target > 0 ? (totalIncome / target) * 100 : 0;
    const displayPct = Math.round(pct);
    const ringPct = Math.min(100, pct);

    const ring = document.getElementById('progressRing');
    if (ring) {
        ring.style.background = `conic-gradient(var(--gojek) ${ringPct}%, var(--border) ${ringPct}%)`;
    }

    const pctEl = document.getElementById('progressPct');
    if (pctEl) pctEl.textContent = `${displayPct}%`;

    const targetEl = document.getElementById('targetValue');
    if (targetEl) targetEl.textContent = formatRupiah(target);

    const achievedEl = document.getElementById('achievedValue');
    if (achievedEl) achievedEl.textContent = formatRupiah(totalIncome);

    updateRingkasan(summary);
}

function updateRingkasan(summary) {
    const totalIncome = summary.totalIncome || 0;
    const totalExpense = summary.totalExpense || 0;
    const netIncome = summary.netIncome || 0;

    const incomeEl = document.getElementById('statIncome');
    const expenseEl = document.getElementById('statExpense');
    const netEl = document.getElementById('statNet');

    if (incomeEl) incomeEl.textContent = formatRupiah(totalIncome);
    if (expenseEl) expenseEl.textContent = formatRupiah(totalExpense);
    if (netEl) netEl.textContent = formatRupiah(netIncome);
}

function formatRupiahShort(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'rb';
    }
    return num.toString();
}

function getWeekRangeFromDate(dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
    };
}

function navigateDate(offset) {
    const date = new Date(selectedDate);
    const days = currentDashboardView === 'weekly' ? offset * 7 : offset;
    date.setDate(date.getDate() + days);
    selectedDate = date.toISOString().split('T')[0];
    updateDashboard();
}

function loadDashboardByDate() {
    selectedDate = document.getElementById('dashboardDate').value;
    updateDashboard();
}

function goToToday() {
    selectedDate = getToday();
    updateDashboard();
}

// ==================== INCOME PAGE ====================
function loadIncomeList() {
    const filterMonth = document.getElementById('incomeFilterMonth').value;
    const filterPlatform = document.getElementById('incomeFilterPlatform').value;

    let incomes = getIncome();

    if (filterMonth) {
        incomes = incomes.filter(i => i.date.startsWith(filterMonth));
    }
    if (filterPlatform) {
        incomes = incomes.filter(i => i.platform === filterPlatform);
    }

    incomes.sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('incomeList');

    if (incomes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>No income data</p>
            </div>
        `;
        return;
    }

    const logoUrls = {
        gojek: 'gojek-logo.png',
        grab: 'grab-logo.png'
    };

    container.innerHTML = incomes.map(item => `
        <div class="data-item">
            <div class="data-item-left">
                <div class="data-icon ${item.platform}">
                    <img src="${logoUrls[item.platform]}" alt="${item.platform}" class="data-logo-img">
                </div>
                <div class="data-info">
                    <h4>${item.platform === 'gojek' ? 'Gojek' : 'Grab'}</h4>
                    <p>${formatDateShort(item.date)} • ${item.note || '-'}</p>
                </div>
            </div>
            <div class="data-item-right">
                <div class="data-amount">
                    <span class="amount income">+${formatRupiah(item.amount + (item.bonus || 0))}</span>
                    <span class="orders">${item.orders} order${item.bonus ? ` • Bonus ${formatRupiah(item.bonus)}` : ''}</span>
                </div>
                <div class="data-actions">
                    <button class="btn-edit" onclick="editIncome(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="confirmDeleteIncome(${item.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function editIncome(id) {
    const incomes = getIncome();
    const item = incomes.find(i => i.id === id);
    if (!item) return;

    document.getElementById('editModalTitle').textContent = 'Edit Income';
    document.getElementById('editId').value = id;
    document.getElementById('editType').value = 'income';

    document.getElementById('editFormContent').innerHTML = `
        <div class="form-group">
            <label>Platform</label>
            <select id="editPlatform">
                <option value="gojek" ${item.platform === 'gojek' ? 'selected' : ''}>Gojek</option>
                <option value="grab" ${item.platform === 'grab' ? 'selected' : ''}>Grab</option>
            </select>
        </div>
        <div class="form-group">
            <label>Date</label>
            <input type="date" id="editDate" value="${item.date}">
        </div>
        <div class="form-group">
            <label>Income (Rp)</label>
            <input type="number" id="editAmount" value="${item.amount}">
        </div>
        <div class="form-group">
            <label>Total Orders</label>
            <input type="number" id="editOrders" value="${item.orders}">
        </div>
        <div class="form-group">
            <label>Bonus (Rp)</label>
            <input type="number" id="editBonus" value="${item.bonus || 0}">
        </div>
        <div class="form-group">
            <label>Note</label>
            <input type="text" id="editNote" value="${item.note || ''}">
        </div>
    `;

    document.getElementById('editModal').classList.add('show');
}

async function confirmDeleteIncome(id) {
    if (confirm('Are you sure you want to delete this data?')) {
        await deleteIncome(id);
        loadIncomeList();
        updateDashboard();
        showToast('Data deleted successfully');
    }
}

// ==================== EXPENSE PAGE ====================
function loadExpenseList() {
    const filterMonth = document.getElementById('expenseFilterMonth').value;
    const filterCategory = document.getElementById('expenseFilterCategory').value;

    let expenses = getExpense();

    if (filterMonth) {
        expenses = expenses.filter(e => e.date.startsWith(filterMonth));
    }
    if (filterCategory) {
        expenses = expenses.filter(e => e.category === filterCategory);
    }

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    const container = document.getElementById('expenseList');
    const icons = { bensin: '⛽', pulsa: '📱', makan: '🍜', ngopi: '☕', service: '🔧', parkir: '🅿️', lainnya: '📦' };
    const labels = { bensin: 'Fuel', pulsa: 'Data/Phone', makan: 'Food', ngopi: 'Coffee', service: 'Service', parkir: 'Parking', lainnya: 'Others' };

    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>No expense data</p>
            </div>
        `;
        return;
    }

    container.innerHTML = expenses.map(item => `
        <div class="data-item">
            <div class="data-item-left">
                <div class="data-icon ${item.category}">
                    ${icons[item.category]}
                </div>
                <div class="data-info">
                    <h4>${labels[item.category]}</h4>
                    <p>${formatDateShort(item.date)} • ${item.note || '-'}</p>
                </div>
            </div>
            <div class="data-item-right">
                <div class="data-amount">
                    <span class="amount expense">-${formatRupiah(item.amount)}</span>
                </div>
                <div class="data-actions">
                    <button class="btn-edit" onclick="editExpense(${item.id})">Edit</button>
                    <button class="btn-delete" onclick="confirmDeleteExpense(${item.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

function editExpense(id) {
    const expenses = getExpense();
    const item = expenses.find(e => e.id === id);
    if (!item) return;

    document.getElementById('editModalTitle').textContent = 'Edit Expense';
    document.getElementById('editId').value = id;
    document.getElementById('editType').value = 'expense';

    const categories = ['bensin', 'pulsa', 'makan', 'ngopi', 'service', 'parkir', 'lainnya'];
    const labels = { bensin: 'Fuel', pulsa: 'Data/Phone', makan: 'Food', ngopi: 'Coffee', service: 'Service', parkir: 'Parking', lainnya: 'Others' };

    document.getElementById('editFormContent').innerHTML = `
        <div class="form-group">
            <label>Category</label>
            <select id="editCategory">
                ${categories.map(c => `<option value="${c}" ${item.category === c ? 'selected' : ''}>${labels[c]}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Date</label>
            <input type="date" id="editDate" value="${item.date}">
        </div>
        <div class="form-group">
            <label>Amount (Rp)</label>
            <input type="number" id="editAmount" value="${item.amount}">
        </div>
        <div class="form-group">
            <label>Note</label>
            <input type="text" id="editNote" value="${item.note || ''}">
        </div>
    `;

    document.getElementById('editModal').classList.add('show');
}

async function confirmDeleteExpense(id) {
    if (confirm('Are you sure you want to delete this data?')) {
        await deleteExpense(id);
        loadExpenseList();
        updateDashboard();
        showToast('Data deleted successfully');
    }
}

// ==================== TARGET PAGE ====================
function loadTargetPage() {
    const target = getTarget();
    document.getElementById('targetWeekday').value = target.weekday;
    document.getElementById('targetWeekend').value = target.weekend;
    document.getElementById('targetWeekly').value = target.weekly;
    document.getElementById('targetMonthly').value = target.monthly;

    const today = getToday();
    const todayIncomes = getIncomeByDate(today);
    const todayExpenses = getExpenseByDate(today);
    const todaySummary = calculateSummary(todayIncomes, todayExpenses);

    const weekRange = getWeekRange();
    const weekIncomes = getIncomeByDateRange(weekRange.start, weekRange.end);
    const weekExpenses = getExpenseByDateRange(weekRange.start, weekRange.end);
    const weekSummary = calculateSummary(weekIncomes, weekExpenses);

    const now = new Date();
    const monthRange = getMonthRange(now.getFullYear(), now.getMonth() + 1);
    const monthIncomes = getIncomeByDateRange(monthRange.start, monthRange.end);
    const monthExpenses = getExpenseByDateRange(monthRange.start, monthRange.end);
    const monthSummary = calculateSummary(monthIncomes, monthExpenses);

    const dailyTarget = getDailyTarget(today);
    const dailyPercent = dailyTarget > 0 ? Math.min(100, (todaySummary.netIncome / dailyTarget) * 100) : 0;
    document.getElementById('dailyPercent').textContent = `${Math.round(dailyPercent)}%`;
    document.getElementById('dailyCurrent').textContent = formatRupiah(todaySummary.netIncome);
    document.getElementById('dailyGoal').textContent = formatRupiah(dailyTarget);
    document.getElementById('dailyRing').style.background = `conic-gradient(var(--primary) ${dailyPercent}%, var(--border) ${dailyPercent}%)`;

    const dayLabel = isWeekend(today) ? 'Today (Weekend)' : 'Today (Weekday)';
    const targetTodayLabel = document.querySelector('.target-card:first-child .target-label');
    if (targetTodayLabel) targetTodayLabel.textContent = dayLabel;
    document.getElementById('targetTodayDate').textContent = formatDateShort(today);

    const weeklyPercent = target.weekly > 0 ? Math.min(100, (weekSummary.netIncome / target.weekly) * 100) : 0;
    document.getElementById('weeklyPercent').textContent = `${Math.round(weeklyPercent)}%`;
    document.getElementById('weeklyCurrent').textContent = formatRupiah(weekSummary.netIncome);
    document.getElementById('weeklyGoal').textContent = formatRupiah(target.weekly);
    document.getElementById('weeklyRing').style.background = `conic-gradient(var(--primary) ${weeklyPercent}%, var(--border) ${weeklyPercent}%)`;
    document.getElementById('targetWeekDate').textContent = `${formatDateShort(weekRange.start)} - ${formatDateShort(weekRange.end)}`;

    const monthlyPercent = target.monthly > 0 ? Math.min(100, (monthSummary.netIncome / target.monthly) * 100) : 0;
    document.getElementById('monthlyPercent').textContent = `${Math.round(monthlyPercent)}%`;
    document.getElementById('monthlyCurrent').textContent = formatRupiah(monthSummary.netIncome);
    document.getElementById('monthlyGoal').textContent = formatRupiah(target.monthly);
    document.getElementById('monthlyRing').style.background = `conic-gradient(var(--primary) ${monthlyPercent}%, var(--border) ${monthlyPercent}%)`;

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('targetMonthDate').textContent = months[now.getMonth()];
}

// ==================== MODAL ====================
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

async function saveEdit(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editId').value);
    const type = document.getElementById('editType').value;

    showLoading('Saving...');

    if (type === 'income') {
        await updateIncome(id, {
            platform: document.getElementById('editPlatform').value,
            date: document.getElementById('editDate').value,
            amount: parseInt(document.getElementById('editAmount').value) || 0,
            orders: parseInt(document.getElementById('editOrders').value) || 0,
            bonus: parseInt(document.getElementById('editBonus').value) || 0,
            note: document.getElementById('editNote').value
        });
        loadIncomeList();
    } else {
        await updateExpense(id, {
            category: document.getElementById('editCategory').value,
            date: document.getElementById('editDate').value,
            amount: parseInt(document.getElementById('editAmount').value) || 0,
            note: document.getElementById('editNote').value
        });
        loadExpenseList();
    }

    hideLoading();
    closeEditModal();
    updateDashboard();
    showToast('Data updated successfully');
}

// ==================== EXPORT DATA ====================
function exportData() {
    const data = {
        income: getIncome(),
        expense: getExpense(),
        target: getTarget(),
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ojol-data-${getToday()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully');
}

// ==================== INITIALIZE FILTERS ====================
function initFilters() {
    const now = new Date();
    const months = [];

    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        months.push({ value, label });
    }

    const monthSelects = ['incomeFilterMonth', 'expenseFilterMonth'];
    monthSelects.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const defaultOption = select.querySelector('option');
            select.innerHTML = defaultOption ? defaultOption.outerHTML : '';
            months.forEach(m => {
                const option = document.createElement('option');
                option.value = m.value;
                option.textContent = m.label;
                select.appendChild(option);
            });
        }
    });
}

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    // Check login status first
    checkLogin();

    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Set default dates
    document.getElementById('incomeDate').value = getToday();
    document.getElementById('expenseDate').value = getToday();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            switchPage(this.dataset.page);
        });
    });

    // Income form
    document.getElementById('incomeForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            const platform = document.querySelector('input[name="platform"]:checked')?.value;
            const dateVal = document.getElementById('incomeDate')?.value;
            const amountVal = document.getElementById('incomeAmount')?.value;
            const ordersVal = document.getElementById('incomeOrders')?.value;
            const bonusVal = document.getElementById('incomeBonus')?.value;
            const noteVal = document.getElementById('incomeNote')?.value;

            if (!platform || !dateVal || !amountVal || !ordersVal) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            const income = {
                platform: platform,
                date: dateVal,
                amount: parseInt(amountVal) || 0,
                orders: parseInt(ordersVal) || 0,
                bonus: parseInt(bonusVal) || 0,
                note: noteVal || ''
            };

            const result = await addIncome(income);
            if (result) {
                this.reset();
                document.getElementById('incomeDate').value = getToday();
                document.querySelector('input[name="platform"][value="gojek"]').checked = true;

                const currentMonth = getToday().substring(0, 7);
                document.getElementById('incomeFilterMonth').value = currentMonth;

                loadIncomeList();
                updateDashboard();
                showToast('Income added successfully');
            }
        } catch (err) {
            console.error('Error adding income:', err);
            showToast('Failed to save: ' + err.message, 'error');
        }
    });

    // Expense form
    document.getElementById('expenseForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const categoryVal = document.getElementById('expenseCategory')?.value;
        const dateVal = document.getElementById('expenseDate')?.value;
        const amountVal = document.getElementById('expenseAmount')?.value;
        const noteVal = document.getElementById('expenseNote')?.value;

        if (!categoryVal || !dateVal || !amountVal) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        const expense = {
            category: categoryVal,
            date: dateVal,
            amount: parseInt(amountVal) || 0,
            note: noteVal || ''
        };

        const result = await addExpense(expense);
        if (result) {
            this.reset();
            document.getElementById('expenseDate').value = getToday();
            loadExpenseList();
            updateDashboard();
            showToast('Expense added successfully');
        }
    });

    // Target form
    document.getElementById('targetForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const weekday = parseInt(document.getElementById('targetWeekday').value) || 0;
        const weekend = parseInt(document.getElementById('targetWeekend').value) || 0;

        const target = {
            weekday: weekday,
            weekend: weekend,
            weekly: parseInt(document.getElementById('targetWeekly').value) || (weekday * 5 + weekend * 2),
            monthly: parseInt(document.getElementById('targetMonthly').value) || (weekday * 5 + weekend * 2) * 4
        };

        const success = await saveTarget(target);
        if (success) {
            loadTargetPage();
            updateDashboard();
            showToast('Target saved successfully');
        }
    });

    // Auto-calculate targets
    document.getElementById('targetWeekday').addEventListener('input', autoCalculateTargets);
    document.getElementById('targetWeekend').addEventListener('input', autoCalculateTargets);

    // Filters
    document.getElementById('incomeFilterMonth').addEventListener('change', loadIncomeList);
    document.getElementById('incomeFilterPlatform').addEventListener('change', loadIncomeList);
    document.getElementById('expenseFilterMonth').addEventListener('change', loadExpenseList);
    document.getElementById('expenseFilterCategory').addEventListener('change', loadExpenseList);

    // Edit form
    document.getElementById('editForm').addEventListener('submit', saveEdit);

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Close modal on outside click
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });
});
