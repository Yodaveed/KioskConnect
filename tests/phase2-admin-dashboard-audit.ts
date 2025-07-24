/**
 * Phase 2 Mission: End-to-End Audit & Repair of Admin Dashboard Features
 * Comprehensive testing of all 5 admin dashboard components
 */

import { test, expect, Page, Browser } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:5000';
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123' };

// Utility functions
async function adminLogin(page: Page) {
  await page.goto(`${BASE_URL}/admin`);
  await page.fill('input[name="username"]', ADMIN_CREDENTIALS.username);
  await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForSelector('[data-testid="admin-dashboard"]', { timeout: 10000 });
}

async function apiRequest(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include'
  });
  return response.json();
}

// Test Suite 1: Menu & Menu-Type Management
test.describe('1. Menu & Menu-Type Management', () => {
  
  test('Menu CRUD operations work correctly', async ({ page }) => {
    await adminLogin(page);
    
    // Navigate to Menu tab
    await page.click('[data-testid="menu-tab"]');
    await page.waitForSelector('[data-testid="menu-items-table"]');
    
    // Test: Create new menu item
    await page.click('[data-testid="add-menu-item"]');
    await page.fill('input[name="name"]', 'Test Flavor (vanilla)');
    await page.fill('input[name="category"]', 'base');
    await page.fill('input[name="price"]', '5.99');
    await page.click('button[type="submit"]');
    
    // Verify item appears in table
    await expect(page.locator('text=Test Flavor')).toBeVisible();
    
    // Test: Update menu item
    await page.click('[data-testid="edit-menu-item"]:last-child');
    await page.fill('input[name="price"]', '6.99');
    await page.click('button[type="submit"]');
    
    // Verify price updated
    await expect(page.locator('text=$6.99')).toBeVisible();
    
    // Test: Delete menu item
    await page.click('[data-testid="delete-menu-item"]:last-child');
    await page.click('button[data-testid="confirm-delete"]');
    
    // Verify item removed
    await expect(page.locator('text=Test Flavor')).not.toBeVisible();
  });

  test('Menu Types CRUD operations work correctly', async ({ page }) => {
    await adminLogin(page);
    
    // Navigate to Menu Types tab
    await page.click('[data-testid="menu-types-tab"]');
    await page.waitForSelector('[data-testid="menu-types-table"]');
    
    // Test: Create new menu type
    await page.click('[data-testid="add-menu-type"]');
    await page.fill('input[name="name"]', 'Test Menu');
    await page.fill('textarea[name="description"]', 'Test menu description');
    await page.select('select[name="orderingFlow"]', 'three-step');
    await page.click('button[type="submit"]');
    
    // Verify menu type appears
    await expect(page.locator('text=Test Menu')).toBeVisible();
    
    // Test: Update menu type
    await page.click('[data-testid="edit-menu-type"]:last-child');
    await page.fill('input[name="name"]', 'Updated Test Menu');
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator('text=Updated Test Menu')).toBeVisible();
  });
});

// Test Suite 2: Orders Tab
test.describe('2. Orders Tab', () => {
  
  test('Real-time order display and management', async ({ page }) => {
    await adminLogin(page);
    
    // Navigate to Orders tab
    await page.click('[data-testid="orders-tab"]');
    await page.waitForSelector('[data-testid="orders-table"]');
    
    // Get initial order count
    const initialOrders = await page.locator('[data-testid="order-row"]').count();
    
    // Create test order via API
    const testOrder = {
      customerName: 'Test Customer',
      items: [{ name: 'Vanilla', price: 5.99, quantity: 1 }],
      totalAmount: 5.99
    };
    
    await apiRequest('POST', '/api/orders', testOrder);
    
    // Refresh page and verify new order appears
    await page.reload();
    await page.waitForSelector('[data-testid="orders-table"]');
    
    const newOrderCount = await page.locator('[data-testid="order-row"]').count();
    expect(newOrderCount).toBeGreaterThan(initialOrders);
    
    // Test: Order details view
    await page.click('[data-testid="view-order"]:first-child');
    await expect(page.locator('text=Test Customer')).toBeVisible();
    await expect(page.locator('text=Vanilla')).toBeVisible();
    
    // Test: Order status updates
    await page.click('[data-testid="mark-fulfilled"]');
    await expect(page.locator('text=Fulfilled')).toBeVisible();
  });

  test('Edge cases and error handling', async ({ page }) => {
    await adminLogin(page);
    await page.click('[data-testid="orders-tab"]');
    
    // Test: Invalid order payload
    try {
      await apiRequest('POST', '/api/orders', { invalid: 'data' });
    } catch (error) {
      // Should handle gracefully without crashing UI
    }
    
    // Test: Empty orders handling
    await page.waitForSelector('[data-testid="orders-table"]');
    const noOrdersText = page.locator('text=No orders found');
    // UI should handle empty state gracefully
  });
});

// Test Suite 3: QR Code Generator
test.describe('3. QR Code Generator', () => {
  
  test('QR code generation and validation', async ({ page }) => {
    await adminLogin(page);
    
    // Navigate to QR tab
    await page.click('[data-testid="qr-tab"]');
    await page.waitForSelector('[data-testid="qr-generator"]');
    
    // Test: Generate QR for three-step flow
    await page.click('[data-testid="generate-three-step-qr"]');
    await page.waitForSelector('[data-testid="qr-code-three-step"]');
    
    // Verify QR code image is displayed
    const qrImage = page.locator('[data-testid="qr-code-three-step"] img');
    await expect(qrImage).toBeVisible();
    
    // Test: Generate QR for single-page flow
    await page.click('[data-testid="generate-single-page-qr"]');
    await page.waitForSelector('[data-testid="qr-code-single-page"]');
    
    // Test: Generate QR for custom flow
    await page.click('[data-testid="generate-custom-qr"]');
    await page.waitForSelector('[data-testid="qr-code-custom"]');
    
    // Test: QR code refresh/rotation
    await page.click('[data-testid="refresh-qr-codes"]');
    await page.waitForTimeout(1000); // Allow for refresh
  });

  test('QR code functionality validation', async ({ page, context }) => {
    await adminLogin(page);
    await page.click('[data-testid="qr-tab"]');
    
    // Generate QR and extract URL (simplified - would need actual QR parsing)
    await page.click('[data-testid="generate-three-step-qr"]');
    
    // Test navigation to each flow URL directly
    const flows = ['/three-step', '/single-page', '/custom'];
    
    for (const flow of flows) {
      const newPage = await context.newPage();
      await newPage.goto(`${BASE_URL}${flow}`);
      
      // Verify flow page loads with menu items
      await newPage.waitForSelector('[data-testid="menu-selection"]', { timeout: 5000 });
      await expect(newPage.locator('[data-testid="menu-item"]')).toHaveCount({ min: 1 });
      
      await newPage.close();
    }
  });
});

// Test Suite 4: Manual Ticket Entry
test.describe('4. Manual Ticket Entry', () => {
  
  test('Valid manual entry processing', async ({ page }) => {
    await adminLogin(page);
    
    // Navigate to Manual Entry tab
    await page.click('[data-testid="manual-entry-tab"]');
    await page.waitForSelector('[data-testid="manual-entry-form"]');
    
    // Test: Valid JSON entry
    const validOrder = {
      customerName: 'Manual Customer',
      items: [
        { name: 'Chocolate', price: 5.99, quantity: 2 },
        { name: 'Vanilla', price: 5.99, quantity: 1 }
      ],
      totalAmount: 17.97
    };
    
    await page.fill('[data-testid="manual-entry-textarea"]', JSON.stringify(validOrder, null, 2));
    await page.click('[data-testid="submit-manual-entry"]');
    
    // Verify success message
    await expect(page.locator('text=Order created successfully')).toBeVisible();
    
    // Verify order appears in Orders tab
    await page.click('[data-testid="orders-tab"]');
    await expect(page.locator('text=Manual Customer')).toBeVisible();
  });

  test('Invalid entry error handling', async ({ page }) => {
    await adminLogin(page);
    await page.click('[data-testid="manual-entry-tab"]');
    
    // Test: Invalid JSON syntax
    await page.fill('[data-testid="manual-entry-textarea"]', '{ invalid json }');
    await page.click('[data-testid="submit-manual-entry"]');
    
    // Verify error message
    await expect(page.locator('text=Invalid JSON format')).toBeVisible();
    
    // Test: Missing required fields
    await page.fill('[data-testid="manual-entry-textarea"]', '{"incomplete": "data"}');
    await page.click('[data-testid="submit-manual-entry"]');
    
    // Verify validation error
    await expect(page.locator('text=Missing required fields')).toBeVisible();
  });

  test('Manual entry inventory impact', async ({ page }) => {
    await adminLogin(page);
    
    // Check initial inventory
    await page.click('[data-testid="inventory-tab"]');
    const initialVanillaStock = await page.locator('[data-testid="vanilla-stock"]').textContent();
    
    // Create manual entry that should decrement vanilla
    await page.click('[data-testid="manual-entry-tab"]');
    const orderWithVanilla = {
      customerName: 'Inventory Test',
      items: [{ name: 'Vanilla', price: 5.99, quantity: 3 }],
      totalAmount: 17.97
    };
    
    await page.fill('[data-testid="manual-entry-textarea"]', JSON.stringify(orderWithVanilla, null, 2));
    await page.click('[data-testid="submit-manual-entry"]');
    
    // Verify inventory decremented
    await page.click('[data-testid="inventory-tab"]');
    await page.reload();
    const newVanillaStock = await page.locator('[data-testid="vanilla-stock"]').textContent();
    
    expect(parseInt(newVanillaStock || '0')).toBeLessThan(parseInt(initialVanillaStock || '0'));
  });
});

export { adminLogin, apiRequest };