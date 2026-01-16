// ==================== GOOGLE APPS SCRIPT FOR OJOL APP ====================
// Deploy this as a Web App in Google Apps Script
// Spreadsheet ID: 1VWcTL1W9_rGepkjtQJ61ZQYyZzcVyPrL5l8qnK5mcLE

const SPREADSHEET_ID = '1VWcTL1W9_rGepkjtQJ61ZQYyZzcVyPrL5l8qnK5mcLE';

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  let result;

  try {
    switch(action) {
      case 'register':
        result = registerUser(e.parameter.username, e.parameter.password);
        break;
      case 'login':
        result = loginUser(e.parameter.username, e.parameter.password);
        break;
      case 'getIncome':
        result = getIncome(e.parameter.username);
        break;
      case 'addIncome':
        result = addIncome(e.parameter.username, e.parameter.income);
        break;
      case 'deleteIncome':
        result = deleteIncome(e.parameter.username, e.parameter.incomeId);
        break;
      case 'getExpense':
        result = getExpense(e.parameter.username);
        break;
      case 'addExpense':
        result = addExpense(e.parameter.username, e.parameter.expense);
        break;
      case 'deleteExpense':
        result = deleteExpense(e.parameter.username, e.parameter.expenseId);
        break;
      case 'getTarget':
        result = getTarget(e.parameter.username);
        break;
      case 'saveTarget':
        result = saveTarget(e.parameter.username, e.parameter.target);
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }
  } catch(error) {
    result = { success: false, error: error.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Get or create sheet
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add headers based on sheet type
    if (name === 'Users') {
      sheet.appendRow(['username', 'password', 'createdAt']);
    } else if (name === 'Income') {
      sheet.appendRow(['username', 'id', 'platform', 'date', 'amount', 'orders', 'bonus', 'note', 'createdAt']);
    } else if (name === 'Expense') {
      sheet.appendRow(['username', 'id', 'category', 'date', 'amount', 'note', 'createdAt']);
    } else if (name === 'Target') {
      sheet.appendRow(['username', 'weekday', 'weekend', 'weekly', 'monthly']);
    }
  }
  return sheet;
}

// ==================== USER FUNCTIONS ====================
function registerUser(username, password) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();

  // Check if username exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return { success: false, error: 'Username already exists!' };
    }
  }

  // Add new user
  const encodedPassword = Utilities.base64Encode(password);
  sheet.appendRow([username, encodedPassword, new Date().toISOString()]);

  // Initialize default target
  const targetSheet = getSheet('Target');
  targetSheet.appendRow([username, 30000, 70000, 290000, 1160000]);

  return { success: true, message: 'Registration successful!' };
}

function loginUser(username, password) {
  const sheet = getSheet('Users');
  const data = sheet.getDataRange().getValues();
  const encodedPassword = Utilities.base64Encode(password);

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      if (data[i][1] === encodedPassword) {
        return {
          success: true,
          message: 'Login successful!',
          user: {
            username: username
          }
        };
      } else {
        return { success: false, error: 'Wrong password!' };
      }
    }
  }

  return { success: false, error: 'Username not found!' };
}

// ==================== INCOME FUNCTIONS ====================
function getIncome(username) {
  const sheet = getSheet('Income');
  const data = sheet.getDataRange().getValues();
  const income = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      income.push({
        id: data[i][1],
        platform: data[i][2],
        date: data[i][3],
        amount: data[i][4],
        orders: data[i][5],
        bonus: data[i][6],
        note: data[i][7],
        createdAt: data[i][8]
      });
    }
  }

  return { success: true, income: income };
}

function addIncome(username, incomeJson) {
  const income = JSON.parse(incomeJson);
  const sheet = getSheet('Income');

  sheet.appendRow([
    username,
    income.id || Date.now(),
    income.platform,
    income.date,
    income.amount,
    income.orders,
    income.bonus || 0,
    income.note || '',
    income.createdAt || new Date().toISOString()
  ]);

  return { success: true, message: 'Income added!' };
}

function deleteIncome(username, incomeId) {
  const sheet = getSheet('Income');
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === username && String(data[i][1]) === String(incomeId)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Income deleted!' };
    }
  }

  return { success: false, error: 'Income not found' };
}

// ==================== EXPENSE FUNCTIONS ====================
function getExpense(username) {
  const sheet = getSheet('Expense');
  const data = sheet.getDataRange().getValues();
  const expense = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      expense.push({
        id: data[i][1],
        category: data[i][2],
        date: data[i][3],
        amount: data[i][4],
        note: data[i][5],
        createdAt: data[i][6]
      });
    }
  }

  return { success: true, expense: expense };
}

function addExpense(username, expenseJson) {
  const expense = JSON.parse(expenseJson);
  const sheet = getSheet('Expense');

  sheet.appendRow([
    username,
    expense.id || Date.now(),
    expense.category,
    expense.date,
    expense.amount,
    expense.note || '',
    expense.createdAt || new Date().toISOString()
  ]);

  return { success: true, message: 'Expense added!' };
}

function deleteExpense(username, expenseId) {
  const sheet = getSheet('Expense');
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === username && String(data[i][1]) === String(expenseId)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Expense deleted!' };
    }
  }

  return { success: false, error: 'Expense not found' };
}

// ==================== TARGET FUNCTIONS ====================
function getTarget(username) {
  const sheet = getSheet('Target');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      return {
        success: true,
        target: {
          weekday: data[i][1],
          weekend: data[i][2],
          weekly: data[i][3],
          monthly: data[i][4]
        }
      };
    }
  }

  // Return default target if not found
  return {
    success: true,
    target: {
      weekday: 30000,
      weekend: 70000,
      weekly: 290000,
      monthly: 1160000
    }
  };
}

function saveTarget(username, targetJson) {
  const target = JSON.parse(targetJson);
  const sheet = getSheet('Target');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === username) {
      sheet.getRange(i + 1, 2, 1, 4).setValues([[
        target.weekday,
        target.weekend,
        target.weekly,
        target.monthly
      ]]);
      return { success: true, message: 'Target saved!' };
    }
  }

  // If not found, create new
  sheet.appendRow([
    username,
    target.weekday,
    target.weekend,
    target.weekly,
    target.monthly
  ]);

  return { success: true, message: 'Target created!' };
}
