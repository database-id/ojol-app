// ==================== DATA STORAGE ====================
const STORAGE_KEYS = {
    INCOME: 'ojol_income',
    EXPENSE: 'ojol_expense',
    TARGET: 'ojol_target'
};

// ==================== UTILITY FUNCTIONS ====================
function formatRupiah(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

function getStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function setStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
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
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
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
    return getStorage(STORAGE_KEYS.INCOME) || [];
}

function saveIncome(data) {
    setStorage(STORAGE_KEYS.INCOME, data);
}

function addIncome(income) {
    const incomes = getIncome();
    income.id = Date.now();
    income.createdAt = new Date().toISOString();
    incomes.push(income);
    saveIncome(incomes);
    return income;
}

function updateIncome(id, data) {
    const incomes = getIncome();
    const index = incomes.findIndex(i => i.id === id);
    if (index !== -1) {
        incomes[index] = { ...incomes[index], ...data };
        saveIncome(incomes);
    }
}

function deleteIncome(id) {
    let incomes = getIncome();
    incomes = incomes.filter(i => i.id !== id);
    saveIncome(incomes);
}

function getIncomeByDate(date) {
    return getIncome().filter(i => i.date === date);
}

function getIncomeByDateRange(startDate, endDate) {
    return getIncome().filter(i => i.date >= startDate && i.date <= endDate);
}

function getIncomeByMonth(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return getIncome().filter(i => i.date.startsWith(monthStr));
}

// ==================== EXPENSE FUNCTIONS ====================
function getExpense() {
    return getStorage(STORAGE_KEYS.EXPENSE) || [];
}

function saveExpense(data) {
    setStorage(STORAGE_KEYS.EXPENSE, data);
}

function addExpense(expense) {
    const expenses = getExpense();
    expense.id = Date.now();
    expense.createdAt = new Date().toISOString();
    expenses.push(expense);
    saveExpense(expenses);
    return expense;
}

function updateExpense(id, data) {
    const expenses = getExpense();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
        expenses[index] = { ...expenses[index], ...data };
        saveExpense(expenses);
    }
}

function deleteExpense(id) {
    let expenses = getExpense();
    expenses = expenses.filter(e => e.id !== id);
    saveExpense(expenses);
}

function getExpenseByDate(date) {
    return getExpense().filter(e => e.date === date);
}

function getExpenseByDateRange(startDate, endDate) {
    return getExpense().filter(e => e.date >= startDate && e.date <= endDate);
}

function getExpenseByMonth(year, month) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    return getExpense().filter(e => e.date.startsWith(monthStr));
}

// ==================== TARGET FUNCTIONS ====================
function getTarget() {
    return getStorage(STORAGE_KEYS.TARGET) || {
        weekday: 30000,
        weekend: 70000,
        weekly: 290000,
        monthly: 1160000
    };
}

function saveTarget(target) {
    setStorage(STORAGE_KEYS.TARGET, target);
}

// Get daily target based on day of week
function getDailyTarget(dateStr) {
    const target = getTarget();
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Weekend is Saturday (6) and Sunday (0)
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

// Auto-calculate weekly and monthly targets based on weekday/weekend
function autoCalculateTargets() {
    const weekday = parseInt(document.getElementById('targetWeekday').value) || 0;
    const weekend = parseInt(document.getElementById('targetWeekend').value) || 0;

    // Weekly = 5 weekdays + 2 weekend days
    const weeklyTarget = (weekday * 5) + (weekend * 2);
    document.getElementById('targetWeekly').value = weeklyTarget;

    // Monthly = approximately 4 weeks
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

    // Refresh data based on page
    if (pageName === 'dashboard') updateDashboard();
    else if (pageName === 'pendapatan') loadIncomeList();
    else if (pageName === 'pengeluaran') loadExpenseList();
    else if (pageName === 'target') loadTargetPage();
}

// ==================== DASHBOARD ====================
// Current selected date for dashboard
let selectedDate = getToday();
let currentDashboardView = 'daily'; // 'daily', 'weekly', 'monthly'
let selectedMonth = new Date().getMonth() + 1;
let selectedYear = new Date().getFullYear();

// Open date picker when clicking date display
function openDatePicker() {
    document.getElementById('dashboardDate').showPicker();
}

// Switch dashboard view (daily, weekly, monthly)
function switchDashboardView(view) {
    currentDashboardView = view;

    // Update tabs
    document.querySelectorAll('.period-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.view === view) {
            tab.classList.add('active');
        }
    });

    // Show/hide navigators
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

// Navigate month for monthly view
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
    // Initialize date picker
    document.getElementById('dashboardDate').value = selectedDate;

    let summary, target, targetLabel;

    if (currentDashboardView === 'daily') {
        // Daily view
        document.getElementById('currentDate').textContent = formatDate(selectedDate);
        const dayIncomes = getIncomeByDate(selectedDate);
        const dayExpenses = getExpenseByDate(selectedDate);
        summary = calculateSummary(dayIncomes, dayExpenses);
        target = getDailyTarget(selectedDate);
        targetLabel = isWeekend(selectedDate) ? 'Target Weekend' : 'Target Hari Kerja';
    } else if (currentDashboardView === 'weekly') {
        // Weekly view - show week range
        const weekRange = getWeekRangeFromDate(selectedDate);
        document.getElementById('currentDate').textContent = `${formatDateShort(weekRange.start)} - ${formatDateShort(weekRange.end)}`;
        const weekIncomes = getIncomeByDateRange(weekRange.start, weekRange.end);
        const weekExpenses = getExpenseByDateRange(weekRange.start, weekRange.end);
        summary = calculateSummary(weekIncomes, weekExpenses);
        target = getTarget().weekly;
        targetLabel = 'Target Mingguan';
    } else if (currentDashboardView === 'monthly') {
        // Monthly view
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        document.getElementById('monthLabel').textContent = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

        const monthRange = getMonthRange(selectedYear, selectedMonth);
        const monthIncomes = getIncomeByDateRange(monthRange.start, monthRange.end);
        const monthExpenses = getExpenseByDateRange(monthRange.start, monthRange.end);
        summary = calculateSummary(monthIncomes, monthExpenses);
        target = getTarget().monthly;
        targetLabel = 'Target Bulanan';
    }

    // Update summary cards
    document.getElementById('summaryGojek').textContent = formatRupiah(summary.gojek.total);
    document.getElementById('summaryGrab').textContent = formatRupiah(summary.grab.total);

    // Update chart
    updateIncomeChart(summary, target);
}

// Update progress ring
function updateIncomeChart(summary, target) {
    const totalIncome = summary.totalIncome;

    // Calculate percentage
    const pct = target > 0 ? (totalIncome / target) * 100 : 0;
    const displayPct = Math.round(pct);
    const ringPct = Math.min(100, pct); // Cap at 100% for visual

    // Update progress ring
    const ring = document.getElementById('progressRing');
    if (ring) {
        ring.style.background = `conic-gradient(var(--gojek) ${ringPct}%, var(--border) ${ringPct}%)`;
    }

    // Update percentage text
    const pctEl = document.getElementById('progressPct');
    if (pctEl) pctEl.textContent = `${displayPct}%`;

    // Update info values
    const targetEl = document.getElementById('targetValue');
    if (targetEl) targetEl.textContent = formatRupiah(target);

    const achievedEl = document.getElementById('achievedValue');
    if (achievedEl) achievedEl.textContent = formatRupiah(totalIncome);

    // Update ringkasan
    updateRingkasan(summary);
}

// Update ringkasan panel
function updateRingkasan(summary) {
    const totalIncome = summary.totalIncome || 0;
    const totalExpense = summary.totalExpense || 0;
    const netIncome = summary.netIncome || 0;

    // Update DOM
    const incomeEl = document.getElementById('statIncome');
    const expenseEl = document.getElementById('statExpense');
    const netEl = document.getElementById('statNet');

    if (incomeEl) incomeEl.textContent = formatRupiah(totalIncome);
    if (expenseEl) expenseEl.textContent = formatRupiah(totalExpense);
    if (netEl) netEl.textContent = formatRupiah(netIncome);
}

// Format rupiah in short form (K for thousands)
function formatRupiahShort(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'jt';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'rb';
    }
    return num.toString();
}

// Load daily activity table
function loadDailyTable(dateStr) {
    const incomes = getIncomeByDate(dateStr);
    const expenses = getExpenseByDate(dateStr);
    const tbody = document.getElementById('activityTableBody');

    if (incomes.length === 0 && expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">Belum ada aktivitas hari ini</td></tr>';
        return;
    }

    // Combine and sort by time
    const gojekSummary = incomes.filter(i => i.platform === 'gojek').reduce((acc, i) => {
        acc.total += i.amount;
        acc.orders++;
        return acc;
    }, { total: 0, orders: 0 });

    const grabSummary = incomes.filter(i => i.platform === 'grab').reduce((acc, i) => {
        acc.total += i.amount;
        acc.orders++;
        return acc;
    }, { total: 0, orders: 0 });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    let html = '';
    if (gojekSummary.orders > 0) {
        html += `
            <tr>
                <td>${formatDateShort(dateStr)}</td>
                <td><div class="platform-cell"><img src="gojek-logo.png" class="platform-logo"> Gojek</div></td>
                <td>${formatRupiah(gojekSummary.total)}</td>
                <td>${gojekSummary.orders}</td>
                <td>-</td>
                <td class="amount-positive">${formatRupiah(gojekSummary.total)}</td>
            </tr>
        `;
    }
    if (grabSummary.orders > 0) {
        html += `
            <tr>
                <td>${formatDateShort(dateStr)}</td>
                <td><div class="platform-cell"><img src="grab-logo.png" class="platform-logo"> Grab</div></td>
                <td>${formatRupiah(grabSummary.total)}</td>
                <td>${grabSummary.orders}</td>
                <td>-</td>
                <td class="amount-positive">${formatRupiah(grabSummary.total)}</td>
            </tr>
        `;
    }
    if (totalExpense > 0) {
        html += `
            <tr>
                <td>${formatDateShort(dateStr)}</td>
                <td>💸 Pengeluaran</td>
                <td>-</td>
                <td>-</td>
                <td class="amount-negative">-${formatRupiah(totalExpense)}</td>
                <td class="amount-negative">-${formatRupiah(totalExpense)}</td>
            </tr>
        `;
    }

    tbody.innerHTML = html || '<tr><td colspan="6" class="empty-cell">Belum ada aktivitas</td></tr>';
}

// Load weekly activity table
function loadWeeklyTable(weekRange) {
    const tbody = document.getElementById('activityTableBody');
    const startDate = new Date(weekRange.start);
    const endDate = new Date(weekRange.end);
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    let html = '';
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayIncomes = getIncomeByDate(dateStr);
        const dayExpenses = getExpenseByDate(dateStr);
        const daySummary = calculateSummary(dayIncomes, dayExpenses);

        const dayName = days[currentDate.getDay()];

        html += `
            <tr>
                <td>${formatDateShort(dateStr)} (${dayName})</td>
                <td>-</td>
                <td>${formatRupiah(daySummary.totalIncome)}</td>
                <td>${daySummary.totalOrders}</td>
                <td class="amount-negative">${daySummary.totalExpense > 0 ? '-' + formatRupiah(daySummary.totalExpense) : '-'}</td>
                <td class="${daySummary.netIncome >= 0 ? 'amount-positive' : 'amount-negative'}">${formatRupiah(daySummary.netIncome)}</td>
            </tr>
        `;

        currentDate.setDate(currentDate.getDate() + 1);
    }

    tbody.innerHTML = html || '<tr><td colspan="6" class="empty-cell">Belum ada aktivitas</td></tr>';
}

// Load monthly activity table
function loadMonthlyTable(monthRange) {
    const tbody = document.getElementById('activityTableBody');
    const startDate = new Date(monthRange.start);
    const endDate = new Date(monthRange.end);

    let html = '';
    let weekNum = 1;
    let currentWeekStart = new Date(startDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    while (currentWeekStart <= endDate) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const effectiveStart = new Date(Math.max(currentWeekStart.getTime(), startDate.getTime()));
        const effectiveEnd = new Date(Math.min(weekEnd.getTime(), endDate.getTime()));

        const weekStartStr = effectiveStart.toISOString().split('T')[0];
        const weekEndStr = effectiveEnd.toISOString().split('T')[0];

        const weekIncomes = getIncomeByDateRange(weekStartStr, weekEndStr);
        const weekExpenses = getExpenseByDateRange(weekStartStr, weekEndStr);
        const weekSummary = calculateSummary(weekIncomes, weekExpenses);

        html += `
            <tr>
                <td>Minggu ${weekNum}</td>
                <td>${formatDateShort(weekStartStr)} - ${formatDateShort(weekEndStr)}</td>
                <td>${formatRupiah(weekSummary.totalIncome)}</td>
                <td>${weekSummary.totalOrders}</td>
                <td class="amount-negative">${weekSummary.totalExpense > 0 ? '-' + formatRupiah(weekSummary.totalExpense) : '-'}</td>
                <td class="${weekSummary.netIncome >= 0 ? 'amount-positive' : 'amount-negative'}">${formatRupiah(weekSummary.netIncome)}</td>
            </tr>
        `;

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNum++;
    }

    tbody.innerHTML = html || '<tr><td colspan="6" class="empty-cell">Belum ada aktivitas</td></tr>';
}

// Update weekly section with data (keep for compatibility)
function updateWeeklySection() {
    const weekRange = getWeekRangeFromDate(selectedDate);
    const weekIncomes = getIncomeByDateRange(weekRange.start, weekRange.end);
    const weekExpenses = getExpenseByDateRange(weekRange.start, weekRange.end);
    const weekSummary = calculateSummary(weekIncomes, weekExpenses);

    // Week range label
    document.getElementById('weekRangeLabel').textContent = `${formatDateShort(weekRange.start)} - ${formatDateShort(weekRange.end)}`;

    // Main stats
    document.getElementById('weeklyIncome').textContent = formatRupiah(weekSummary.totalIncome);
    document.getElementById('weeklyOrders').textContent = weekSummary.totalOrders;
    document.getElementById('weeklyExpense').textContent = formatRupiah(weekSummary.totalExpense);
    document.getElementById('weeklyNet').textContent = formatRupiah(weekSummary.netIncome);

    // Platform breakdown
    document.getElementById('weeklyGojek').textContent = formatRupiah(weekSummary.gojek.total);
    document.getElementById('weeklyGojekOrders').textContent = `${weekSummary.gojek.orders} order`;
    document.getElementById('weeklyGrab').textContent = formatRupiah(weekSummary.grab.total);
    document.getElementById('weeklyGrabOrders').textContent = `${weekSummary.grab.orders} order`;

    // Daily breakdown for the week
    if (currentDashboardView === 'weekly') {
        loadWeeklyDailyBreakdown(weekRange);
    }
}

// Load daily breakdown for weekly view
function loadWeeklyDailyBreakdown(weekRange) {
    const container = document.getElementById('weeklyDailyBreakdown');
    const startDate = new Date(weekRange.start);
    const endDate = new Date(weekRange.end);
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    let html = '<h4 style="font-size: 14px; color: var(--text-gray); margin-bottom: 12px;">Detail per Hari</h4>';

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayIncomes = getIncomeByDate(dateStr);
        const dayExpenses = getExpenseByDate(dateStr);
        const daySummary = calculateSummary(dayIncomes, dayExpenses);

        const dayName = days[currentDate.getDay()];
        const hasData = dayIncomes.length > 0 || dayExpenses.length > 0;

        if (hasData || currentDashboardView === 'weekly') {
            html += `
                <div class="breakdown-item">
                    <div>
                        <span class="breakdown-item-date">${formatDateShort(dateStr)}</span>
                        <span class="breakdown-item-day">${dayName}</span>
                    </div>
                    <div class="breakdown-item-amount">
                        <span class="breakdown-item-total ${daySummary.netIncome >= 0 ? 'positive' : 'negative'}">${formatRupiah(daySummary.netIncome)}</span>
                        <span class="breakdown-item-detail">${daySummary.totalOrders} order • ${formatRupiah(daySummary.totalExpense)} keluar</span>
                    </div>
                </div>
            `;
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    container.innerHTML = html;
}

// Update monthly section with data
function updateMonthlySection() {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    document.getElementById('monthLabel').textContent = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

    const monthRange = getMonthRange(selectedYear, selectedMonth);
    const monthIncomes = getIncomeByDateRange(monthRange.start, monthRange.end);
    const monthExpenses = getExpenseByDateRange(monthRange.start, monthRange.end);
    const monthSummary = calculateSummary(monthIncomes, monthExpenses);

    // Main stats
    document.getElementById('monthlyIncome').textContent = formatRupiah(monthSummary.totalIncome);
    document.getElementById('monthlyOrders').textContent = monthSummary.totalOrders;
    document.getElementById('monthlyExpense').textContent = formatRupiah(monthSummary.totalExpense);
    document.getElementById('monthlyNet').textContent = formatRupiah(monthSummary.netIncome);

    // Platform breakdown
    document.getElementById('monthlyGojek').textContent = formatRupiah(monthSummary.gojek.total);
    document.getElementById('monthlyGojekOrders').textContent = `${monthSummary.gojek.orders} order`;
    document.getElementById('monthlyGrab').textContent = formatRupiah(monthSummary.grab.total);
    document.getElementById('monthlyGrabOrders').textContent = `${monthSummary.grab.orders} order`;

    // Weekly breakdown for the month
    if (currentDashboardView === 'monthly') {
        loadMonthlyWeeklyBreakdown(monthRange);
    }
}

// Load weekly breakdown for monthly view
function loadMonthlyWeeklyBreakdown(monthRange) {
    const container = document.getElementById('monthlyWeeklyBreakdown');
    const startDate = new Date(monthRange.start);
    const endDate = new Date(monthRange.end);

    let html = '<h4 style="font-size: 14px; color: var(--text-gray); margin-bottom: 12px;">Detail per Minggu</h4>';

    let weekNum = 1;
    let currentWeekStart = new Date(startDate);
    // Adjust to Sunday
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    while (currentWeekStart <= endDate) {
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        // Clamp to month range
        const effectiveStart = new Date(Math.max(currentWeekStart.getTime(), startDate.getTime()));
        const effectiveEnd = new Date(Math.min(weekEnd.getTime(), endDate.getTime()));

        const weekStartStr = effectiveStart.toISOString().split('T')[0];
        const weekEndStr = effectiveEnd.toISOString().split('T')[0];

        const weekIncomes = getIncomeByDateRange(weekStartStr, weekEndStr);
        const weekExpenses = getExpenseByDateRange(weekStartStr, weekEndStr);
        const weekSummary = calculateSummary(weekIncomes, weekExpenses);

        html += `
            <div class="breakdown-item">
                <div>
                    <span class="breakdown-item-date">Minggu ${weekNum}</span>
                    <span class="breakdown-item-day">${formatDateShort(weekStartStr)} - ${formatDateShort(weekEndStr)}</span>
                </div>
                <div class="breakdown-item-amount">
                    <span class="breakdown-item-total ${weekSummary.netIncome >= 0 ? 'positive' : 'negative'}">${formatRupiah(weekSummary.netIncome)}</span>
                    <span class="breakdown-item-detail">${weekSummary.totalOrders} order • ${formatRupiah(weekSummary.totalExpense)} keluar</span>
                </div>
            </div>
        `;

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        weekNum++;
    }

    container.innerHTML = html;
}

// Get week range from any date
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

// Navigate to previous/next date
function navigateDate(offset) {
    const date = new Date(selectedDate);
    // For weekly view, navigate by 7 days
    const days = currentDashboardView === 'weekly' ? offset * 7 : offset;
    date.setDate(date.getDate() + days);
    selectedDate = date.toISOString().split('T')[0];
    updateDashboard();
}

// Load dashboard by selected date from date picker
function loadDashboardByDate() {
    selectedDate = document.getElementById('dashboardDate').value;
    updateDashboard();
}

// Go to today
function goToToday() {
    selectedDate = getToday();
    updateDashboard();
}

function loadRecentActivity() {
    const incomes = getIncomeByDate(selectedDate);
    const expenses = getExpenseByDate(selectedDate);

    // Update activity header
    const isToday = selectedDate === getToday();
    const headerText = isToday ? 'Aktivitas Hari Ini' : `Aktivitas ${formatDateShort(selectedDate)}`;
    document.getElementById('activityHeader').textContent = headerText;

    const activities = [
        ...incomes.map(i => ({ ...i, type: 'income' })),
        ...expenses.map(e => ({ ...e, type: 'expense' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const container = document.getElementById('recentList');

    if (activities.length === 0) {
        const emptyText = isToday ? 'Belum ada data hari ini' : `Tidak ada data pada ${formatDateShort(selectedDate)}`;
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>${emptyText}</p>
                <button class="btn btn-primary" onclick="switchPage('pendapatan')">Tambah Pendapatan</button>
            </div>
        `;
        return;
    }

    const logoUrls = {
        gojek: 'gojek-logo.png',
        grab: 'grab-logo.png'
    };

    container.innerHTML = activities.slice(0, 5).map(item => {
        if (item.type === 'income') {
            return `
                <div class="recent-item">
                    <div class="recent-item-left">
                        <div class="recent-platform ${item.platform}">
                            <img src="${logoUrls[item.platform]}" alt="${item.platform}" class="recent-logo-img">
                        </div>
                        <div class="recent-info">
                            <h4>${item.platform === 'gojek' ? 'Gojek' : 'Grab'}</h4>
                            <p>${item.note || `${item.orders} order`}</p>
                        </div>
                    </div>
                    <div class="recent-item-right">
                        <span class="recent-amount income">+${formatRupiah(item.amount + (item.bonus || 0))}</span>
                        <span class="recent-orders">${item.orders} order</span>
                    </div>
                </div>
            `;
        } else {
            const icons = { bensin: '⛽', pulsa: '📱', makan: '🍜', ngopi: '☕', service: '🔧', parkir: '🅿️', lainnya: '📦' };
            const labels = { bensin: 'Bensin', pulsa: 'Pulsa/Data', makan: 'Makan', ngopi: 'Ngopi', service: 'Service', parkir: 'Parkir', lainnya: 'Lainnya' };
            return `
                <div class="recent-item">
                    <div class="recent-item-left">
                        <div class="recent-platform expense">${icons[item.category]}</div>
                        <div class="recent-info">
                            <h4>${labels[item.category]}</h4>
                            <p>${item.note || 'Pengeluaran'}</p>
                        </div>
                    </div>
                    <div class="recent-item-right">
                        <span class="recent-amount expense">-${formatRupiah(item.amount)}</span>
                    </div>
                </div>
            `;
        }
    }).join('');
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
                <p>Belum ada data pendapatan</p>
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
                    <button class="btn-delete" onclick="confirmDeleteIncome(${item.id})">Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
}

function editIncome(id) {
    const incomes = getIncome();
    const item = incomes.find(i => i.id === id);
    if (!item) return;

    document.getElementById('editModalTitle').textContent = 'Edit Pendapatan';
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
            <label>Tanggal</label>
            <input type="date" id="editDate" value="${item.date}">
        </div>
        <div class="form-group">
            <label>Pendapatan (Rp)</label>
            <input type="number" id="editAmount" value="${item.amount}">
        </div>
        <div class="form-group">
            <label>Jumlah Order</label>
            <input type="number" id="editOrders" value="${item.orders}">
        </div>
        <div class="form-group">
            <label>Bonus (Rp)</label>
            <input type="number" id="editBonus" value="${item.bonus || 0}">
        </div>
        <div class="form-group">
            <label>Catatan</label>
            <input type="text" id="editNote" value="${item.note || ''}">
        </div>
    `;

    document.getElementById('editModal').classList.add('show');
}

function confirmDeleteIncome(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        deleteIncome(id);
        loadIncomeList();
        updateDashboard();
        showToast('Data berhasil dihapus');
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
    const labels = { bensin: 'Bensin', pulsa: 'Pulsa/Data', makan: 'Makan', ngopi: 'Ngopi', service: 'Service', parkir: 'Parkir', lainnya: 'Lainnya' };

    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📝</span>
                <p>Belum ada data pengeluaran</p>
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
                    <button class="btn-delete" onclick="confirmDeleteExpense(${item.id})">Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
}

function editExpense(id) {
    const expenses = getExpense();
    const item = expenses.find(e => e.id === id);
    if (!item) return;

    document.getElementById('editModalTitle').textContent = 'Edit Pengeluaran';
    document.getElementById('editId').value = id;
    document.getElementById('editType').value = 'expense';

    const categories = ['bensin', 'pulsa', 'makan', 'ngopi', 'service', 'parkir', 'lainnya'];
    const labels = { bensin: 'Bensin', pulsa: 'Pulsa/Data', makan: 'Makan', ngopi: 'Ngopi', service: 'Service', parkir: 'Parkir', lainnya: 'Lainnya' };

    document.getElementById('editFormContent').innerHTML = `
        <div class="form-group">
            <label>Kategori</label>
            <select id="editCategory">
                ${categories.map(c => `<option value="${c}" ${item.category === c ? 'selected' : ''}>${labels[c]}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Tanggal</label>
            <input type="date" id="editDate" value="${item.date}">
        </div>
        <div class="form-group">
            <label>Jumlah (Rp)</label>
            <input type="number" id="editAmount" value="${item.amount}">
        </div>
        <div class="form-group">
            <label>Catatan</label>
            <input type="text" id="editNote" value="${item.note || ''}">
        </div>
    `;

    document.getElementById('editModal').classList.add('show');
}

function confirmDeleteExpense(id) {
    if (confirm('Yakin ingin menghapus data ini?')) {
        deleteExpense(id);
        loadExpenseList();
        updateDashboard();
        showToast('Data berhasil dihapus');
    }
}

// ==================== TARGET PAGE ====================
function loadTargetPage() {
    const target = getTarget();
    document.getElementById('targetWeekday').value = target.weekday;
    document.getElementById('targetWeekend').value = target.weekend;
    document.getElementById('targetWeekly').value = target.weekly;
    document.getElementById('targetMonthly').value = target.monthly;

    // Update target progress cards
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

    // Daily (based on weekday/weekend)
    const dailyTarget = getDailyTarget(today);
    const dailyPercent = dailyTarget > 0 ? Math.min(100, (todaySummary.netIncome / dailyTarget) * 100) : 0;
    document.getElementById('dailyPercent').textContent = `${Math.round(dailyPercent)}%`;
    document.getElementById('dailyCurrent').textContent = formatRupiah(todaySummary.netIncome);
    document.getElementById('dailyGoal').textContent = formatRupiah(dailyTarget);
    document.getElementById('dailyRing').style.background = `conic-gradient(var(--primary) ${dailyPercent}%, var(--border) ${dailyPercent}%)`;

    // Show weekday/weekend label
    const dayLabel = isWeekend(today) ? 'Hari Ini (Weekend)' : 'Hari Ini (Hari Kerja)';
    const targetTodayLabel = document.querySelector('.target-card:first-child .target-label');
    if (targetTodayLabel) targetTodayLabel.textContent = dayLabel;
    document.getElementById('targetTodayDate').textContent = formatDateShort(today);

    // Weekly
    const weeklyPercent = target.weekly > 0 ? Math.min(100, (weekSummary.netIncome / target.weekly) * 100) : 0;
    document.getElementById('weeklyPercent').textContent = `${Math.round(weeklyPercent)}%`;
    document.getElementById('weeklyCurrent').textContent = formatRupiah(weekSummary.netIncome);
    document.getElementById('weeklyGoal').textContent = formatRupiah(target.weekly);
    document.getElementById('weeklyRing').style.background = `conic-gradient(var(--primary) ${weeklyPercent}%, var(--border) ${weeklyPercent}%)`;
    document.getElementById('targetWeekDate').textContent = `${formatDateShort(weekRange.start)} - ${formatDateShort(weekRange.end)}`;

    // Monthly
    const monthlyPercent = target.monthly > 0 ? Math.min(100, (monthSummary.netIncome / target.monthly) * 100) : 0;
    document.getElementById('monthlyPercent').textContent = `${Math.round(monthlyPercent)}%`;
    document.getElementById('monthlyCurrent').textContent = formatRupiah(monthSummary.netIncome);
    document.getElementById('monthlyGoal').textContent = formatRupiah(target.monthly);
    document.getElementById('monthlyRing').style.background = `conic-gradient(var(--primary) ${monthlyPercent}%, var(--border) ${monthlyPercent}%)`;

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    document.getElementById('targetMonthDate').textContent = months[now.getMonth()];
}

// ==================== MODAL ====================
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

function saveEdit(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editId').value);
    const type = document.getElementById('editType').value;

    if (type === 'income') {
        updateIncome(id, {
            platform: document.getElementById('editPlatform').value,
            date: document.getElementById('editDate').value,
            amount: parseInt(document.getElementById('editAmount').value) || 0,
            orders: parseInt(document.getElementById('editOrders').value) || 0,
            bonus: parseInt(document.getElementById('editBonus').value) || 0,
            note: document.getElementById('editNote').value
        });
        loadIncomeList();
    } else {
        updateExpense(id, {
            category: document.getElementById('editCategory').value,
            date: document.getElementById('editDate').value,
            amount: parseInt(document.getElementById('editAmount').value) || 0,
            note: document.getElementById('editNote').value
        });
        loadExpenseList();
    }

    closeEditModal();
    updateDashboard();
    showToast('Data berhasil diupdate');
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
    showToast('Data berhasil di-export');
}

// ==================== INITIALIZE FILTERS ====================
function initFilters() {
    const now = new Date();
    const months = [];

    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
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
    // Initialize
    initFilters();
    updateDashboard();

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
    document.getElementById('incomeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        try {
            const platform = document.querySelector('input[name="platform"]:checked').value;
            const dateVal = document.getElementById('incomeDate').value;
            const amountVal = document.getElementById('incomeAmount').value;
            const ordersVal = document.getElementById('incomeOrders').value;

            if (!dateVal || !amountVal || !ordersVal) {
                showToast('Lengkapi semua field', 'error');
                return;
            }

            const income = {
                platform,
                date: dateVal,
                amount: parseInt(amountVal) || 0,
                orders: parseInt(ordersVal) || 0,
                bonus: parseInt(document.getElementById('incomeBonus').value) || 0,
                note: document.getElementById('incomeNote').value
            };

            addIncome(income);
            this.reset();
            document.getElementById('incomeDate').value = getToday();
            document.querySelector('input[name="platform"][value="gojek"]').checked = true;

            // Reset filter to show current month
            const currentMonth = getToday().substring(0, 7);
            document.getElementById('incomeFilterMonth').value = currentMonth;

            loadIncomeList();
            updateDashboard();
            showToast('Pendapatan berhasil ditambahkan');
        } catch (err) {
            console.error('Error adding income:', err);
            showToast('Gagal menyimpan: ' + err.message, 'error');
        }
    });

    // Expense form
    document.getElementById('expenseForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const expense = {
            category: document.getElementById('expenseCategory').value,
            date: document.getElementById('expenseDate').value,
            amount: parseInt(document.getElementById('expenseAmount').value) || 0,
            note: document.getElementById('expenseNote').value
        };
        addExpense(expense);
        this.reset();
        document.getElementById('expenseDate').value = getToday();
        loadExpenseList();
        updateDashboard();
        showToast('Pengeluaran berhasil ditambahkan');
    });

    // Target form
    document.getElementById('targetForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const weekday = parseInt(document.getElementById('targetWeekday').value) || 0;
        const weekend = parseInt(document.getElementById('targetWeekend').value) || 0;

        const target = {
            weekday: weekday,
            weekend: weekend,
            weekly: parseInt(document.getElementById('targetWeekly').value) || (weekday * 5 + weekend * 2),
            monthly: parseInt(document.getElementById('targetMonthly').value) || (weekday * 5 + weekend * 2) * 4
        };
        saveTarget(target);
        loadTargetPage();
        updateDashboard();
        showToast('Target berhasil disimpan');
    });

    // Auto-calculate weekly target when weekday/weekend changes
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
