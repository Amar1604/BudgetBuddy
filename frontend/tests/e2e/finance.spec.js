import { test, expect } from '@playwright/test';

// Generate unique credentials for isolation
const financeUser = `e2e_finance_${Math.floor(Math.random() * 100000)}`;
const password = 'SecurePassword123';

test.describe.configure({ mode: 'serial' });

test.describe('Financial CRUD and Workflow Actions', () => {
  let authenticatedPage;

  test.beforeAll(async ({ browser }) => {
    // Register the user once for all tests in this file
    const context = await browser.newContext();
    authenticatedPage = await context.newPage();
    
    // Print page console messages and errors to help debug
    authenticatedPage.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
    authenticatedPage.on('pageerror', err => console.log(`[Browser Error] ${err.stack || err.message}`));
    
    // Listen to network requests/responses to debug API issues
    authenticatedPage.on('requestfailed', request => {
      console.log(`[Browser Request Failed] ${request.method()} ${request.url()}: ${request.failure()?.errorText || 'Failed'}`);
    });
    authenticatedPage.on('response', async response => {
      if (!response.ok()) {
        let errBody = '';
        try { errBody = await response.text(); } catch {}
        console.log(`[Browser Response Error] ${response.request().method()} ${response.url()}: ${response.status()} - ${errBody}`);
      }
    });

    // Automatically accept all native confirm/alert dialogs
    authenticatedPage.on('dialog', async dialog => {
      console.log(`[Browser Dialog] ${dialog.type()}: ${dialog.message()} -> Accepting`);
      await dialog.accept();
    });
    
    await authenticatedPage.goto('/register');
    await authenticatedPage.fill('input[name="username"]', financeUser);
    await authenticatedPage.fill('input[name="email"]', `${financeUser}@example.com`);
    await authenticatedPage.fill('input[name="password"]', password);
    await authenticatedPage.fill('input[name="confirm"]', password);
    await authenticatedPage.click('button[type="submit"]');
    
    await expect(authenticatedPage).toHaveURL('/dashboard');
  });

  test.afterAll(async () => {
    await authenticatedPage.close();
  });

  test('Income CRUD Workflow', async () => {
    await authenticatedPage.goto('/income');
    
    // Add income
    await authenticatedPage.click('button:has-text("Add Income")');
    await authenticatedPage.fill('input[placeholder*="Paycheck"]', 'E2E Salary Project');
    await authenticatedPage.fill('input[placeholder="0.00"]', '5000');
    await authenticatedPage.selectOption('select', 'FREELANCING');
    await authenticatedPage.fill('input[type="date"]', '2026-08-15');
    await authenticatedPage.fill('textarea', 'Payment for custom design work');
    await authenticatedPage.click('button[type="submit"]');
    
    // Assert visible in table
    const table = authenticatedPage.locator('table');
    await expect(table).toContainText('E2E Salary Project');
    await expect(table).toContainText('5,000.00');

    // Edit income
    await authenticatedPage.click('button:has-text("Edit")');
    await authenticatedPage.fill('input[placeholder="0.00"]', '7500');
    await authenticatedPage.click('button[type="submit"]');
    await expect(table).toContainText('7,500.00');

    // Delete income
    await authenticatedPage.click('button:has-text("Delete")');
    await expect(authenticatedPage.locator('text=No income entries yet.')).toBeVisible();
  });

  test('Expense CRUD Workflow', async () => {
    await authenticatedPage.goto('/expenses');
    
    // Add expense
    await authenticatedPage.click('button:has-text("Add Expense")');
    await authenticatedPage.fill('input[placeholder*="Grocery"]', 'Office Chair');
    await authenticatedPage.fill('input[placeholder="0.00"]', '120');
    await authenticatedPage.selectOption('select', 'SHOPPING');
    await authenticatedPage.fill('input[type="date"]', '2026-08-15');
    await authenticatedPage.click('button[type="submit"]');
    
    // Assert visible in table
    const table = authenticatedPage.locator('table');
    await expect(table).toContainText('Office Chair');
    await expect(table).toContainText('120.00');

    // Edit expense
    await authenticatedPage.click('button:has-text("Edit")');
    await authenticatedPage.fill('input[placeholder="0.00"]', '150');
    await authenticatedPage.click('button[type="submit"]');
    await expect(table).toContainText('150.00');

    // Delete expense
    await authenticatedPage.click('button:has-text("Delete")');
    await expect(authenticatedPage.locator('text=No expenses yet.')).toBeVisible();
  });

  test('Savings Goals & Deposit Workflow', async () => {
    await authenticatedPage.goto('/savings');
    
    // Add savings goal
    await authenticatedPage.click('button:has-text("New Goal"), button:has-text("Add Goal")');
    await authenticatedPage.fill('input[placeholder*="Emergency"]', 'Trip to Paris');
    await authenticatedPage.locator('input[placeholder="0.00"]').first().fill('1000');
    await authenticatedPage.locator('input[placeholder="0.00"]').nth(1).fill('100');
    await authenticatedPage.fill('input[type="date"]', '2026-12-31');
    await authenticatedPage.click('button[type="submit"]');
    
    // Verify listed and has progress
    const card = authenticatedPage.locator('.card:has-text("Trip to Paris"), .goal-card:has-text("Trip to Paris")');
    await expect(card).toBeVisible();
    await expect(card).toContainText('10%');

    // Deposit to reach completion
    await card.locator('button:has-text("Deposit")').click();
    await authenticatedPage.locator('.modal:has-text("Deposit") input[placeholder="0.00"]').fill('900');
    await authenticatedPage.click('button[type="submit"]');

    // Assert goal is completed
    await expect(card).toContainText('Completed');
  });

  test('Budget Set & Breach Alerts Notification Workflow', async () => {
    // 1. Go to Budgets and set a budget of 100 on Bills
    await authenticatedPage.goto('/budgets');
    await authenticatedPage.click('button:has-text("Add Budget")');
    await authenticatedPage.locator('select').first().selectOption('BILLS');
    await authenticatedPage.fill('input[placeholder="0.00"]', '100');
    await authenticatedPage.locator('input[type="date"]').first().fill('2026-08-01');
    await authenticatedPage.locator('input[type="date"]').nth(1).fill('2026-08-31');
    await authenticatedPage.click('button[type="submit"]');

    // Verify budget is listed
    await expect(authenticatedPage.locator('table, .card, .budget-card')).toContainText('Bills');

    // 2. Go to Expenses and log an expense of 85 (85% of budget)
    await authenticatedPage.goto('/expenses');
    await authenticatedPage.click('button:has-text("Add Expense")');
    await authenticatedPage.fill('input[placeholder*="Grocery"]', 'Internet Bill');
    await authenticatedPage.fill('input[placeholder="0.00"]', '85');
    await authenticatedPage.selectOption('select', 'BILLS');
    await authenticatedPage.fill('input[type="date"]', '2026-08-15');
    await authenticatedPage.click('button[type="submit"]');

    // 3. Check notifications for 80% breach warning
    await authenticatedPage.goto('/notifications');
    await expect(authenticatedPage.locator('body')).toContainText('80%');

    // 4. Log another expense to breach 100% (e.g. 20)
    await authenticatedPage.goto('/expenses');
    await authenticatedPage.click('button:has-text("Add Expense")');
    await authenticatedPage.fill('input[placeholder*="Grocery"]', 'Phone Bill');
    await authenticatedPage.fill('input[placeholder="0.00"]', '20');
    await authenticatedPage.selectOption('select', 'BILLS');
    await authenticatedPage.fill('input[type="date"]', '2026-08-16');
    await authenticatedPage.click('button[type="submit"]');

    // 5. Check notifications for 100% breach warning
    await authenticatedPage.goto('/notifications');
    await expect(authenticatedPage.locator('body')).toContainText('exceeded');
  });
});
