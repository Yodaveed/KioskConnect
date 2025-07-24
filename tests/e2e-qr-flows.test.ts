/**
 * PHASE 3A: Playwright End-to-End Tests for QR Code Flows
 * Validates all three QR ordering flows with printer integration
 */

import { test, expect, beforeAll, beforeEach } from '@playwright/test';
import { mockedPrinterService } from '../server/mocked-printer';

// Set test environment to enable mocked printer
process.env.NODE_ENV = 'test';

const BASE_URL = 'http://localhost:5000';

test.beforeAll(async () => {
  // Ensure server is running and ready
  console.log('Setting up E2E tests for QR flows');
});

test.beforeEach(async () => {
  // Reset mock printer state before each test
  mockedPrinterService.reset();
});

test.describe('Phase 3A: QR Code Flow Validation', () => {
  
  test.describe('Three-Step Flow QR Code', () => {
    test('Should complete three-step ordering with QR scanning', async ({ page }) => {
      // Generate QR code for three-step flow
      const qrResponse = await page.request.get(`${BASE_URL}/api/qr/generate?flow=three-step&table=T-01&location=Main%20Dining`);
      expect(qrResponse.ok()).toBeTruthy();
      
      const qrData = await qrResponse.json();
      expect(qrData.success).toBeTruthy();
      
      // Extract URL from QR code data
      const qrUrl = qrData.data.targetUrl;
      expect(qrUrl).toContain('/three-step');
      
      // Navigate to QR code URL (simulating scan)
      await page.goto(qrUrl);
      
      // Wait for page to load and verify menu appears
      await page.waitForSelector('[data-testid="menu-container"]', { timeout: 10000 });
      
      // Verify we're on the three-step flow
      await expect(page.locator('h1')).toContainText('Choose Your Base');
      
      // Step 1: Select base
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Next: Choose Sauce")');
      
      // Step 2: Select sauce  
      await page.waitForSelector('h1:has-text("Choose Your Sauce")');
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Next: Choose Toppings")');
      
      // Step 3: Select toppings (including premium item)
      await page.waitForSelector('h1:has-text("Choose Your Toppings")');
      
      // Select regular topping
      await page.click('[data-testid="menu-item"]:first-child');
      
      // Select premium topping (should show premium badge)
      const premiumItem = page.locator('[data-testid="menu-item"]').filter({ hasText: 'Premium' }).first();
      if (await premiumItem.count() > 0) {
        await premiumItem.click();
        
        // Verify premium badge is displayed
        await expect(page.locator('.premium-badge')).toBeVisible();
      }
      
      await page.click('button:has-text("Review Order")');
      
      // Verify order summary
      await page.waitForSelector('[data-testid="order-summary"]');
      await expect(page.locator('h2')).toContainText('Order Summary');
      
      // Enter customer name
      await page.fill('input[placeholder*="name"]', 'QR Test Customer Three-Step');
      
      // Submit order
      await page.click('button:has-text("Submit Order")');
      
      // Wait for confirmation
      await page.waitForSelector('[data-testid="order-confirmation"]', { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('Order Confirmed');
      
      // Verify order number is displayed
      const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
      expect(orderNumber).toBeTruthy();
      
      // Verify printer was called
      expect(mockedPrinterService.getPrintCount()).toBe(1);
      
      const printCall = mockedPrinterService.findPrintCallByOrderNumber(orderNumber!);
      expect(printCall).toBeDefined();
      expect(printCall?.success).toBe(true);
      expect(printCall?.ticketData.customerName).toBe('QR Test Customer Three-Step');
      
      // Verify QR metadata in print data
      expect(printCall?.ticketData.tableNumber).toBe('T-01');
      expect(printCall?.ticketData.location).toBe('Main Dining');
    });
  });

  test.describe('Single-Page Flow QR Code', () => {
    test('Should complete single-page ordering with QR scanning', async ({ page }) => {
      // Generate QR code for single-page flow
      const qrResponse = await page.request.get(`${BASE_URL}/api/qr/generate?flow=single-page&table=T-02&location=Patio`);
      const qrData = await qrResponse.json();
      const qrUrl = qrData.data.targetUrl;
      
      // Navigate to QR code URL
      await page.goto(qrUrl);
      
      // Wait for single-page menu to load
      await page.waitForSelector('[data-testid="menu-container"]');
      
      // Verify we're on the single-page flow (Pints menu)
      await expect(page.locator('h1')).toContainText('Pints');
      
      // Select pint flavors
      await page.click('[data-testid="menu-item"]:first-child');
      
      // Adjust quantity if needed
      const addButton = page.locator('button:has-text("+")').first();
      if (await addButton.count() > 0) {
        await addButton.click();
      }
      
      // Proceed to checkout
      await page.click('button:has-text("Review Order")');
      
      // Verify order summary
      await page.waitForSelector('[data-testid="order-summary"]');
      
      // Enter customer name
      await page.fill('input[placeholder*="name"]', 'QR Test Customer Single-Page');
      
      // Submit order
      await page.click('button:has-text("Submit Order")');
      
      // Wait for confirmation
      await page.waitForSelector('[data-testid="order-confirmation"]', { timeout: 15000 });
      
      const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
      
      // Verify printer integration
      expect(mockedPrinterService.getPrintCount()).toBe(1);
      
      const printCall = mockedPrinterService.findPrintCallByOrderNumber(orderNumber!);
      expect(printCall?.ticketData.tableNumber).toBe('T-02');
      expect(printCall?.ticketData.location).toBe('Patio');
    });
  });

  test.describe('Custom Flow QR Code', () => {
    test('Should complete custom ordering with QR scanning', async ({ page }) => {
      // Generate QR code for custom flow
      const qrResponse = await page.request.get(`${BASE_URL}/api/qr/generate?flow=custom&table=T-03&location=Counter`);
      const qrData = await qrResponse.json();
      const qrUrl = qrData.data.targetUrl;
      
      // Navigate to QR code URL
      await page.goto(qrUrl);
      
      // Wait for custom menu to load
      await page.waitForSelector('[data-testid="menu-container"]');
      
      // Verify we're on the custom flow (Freeze Sticks)
      await expect(page.locator('h1')).toContainText('Freeze Sticks');
      
      // Select size
      await page.click('[data-testid="size-option"]:first-child');
      
      // Select flavors 
      await page.click('[data-testid="flavor-option"]:first-child');
      
      // Add additional flavors if available
      const additionalFlavor = page.locator('[data-testid="flavor-option"]').nth(1);
      if (await additionalFlavor.count() > 0) {
        await additionalFlavor.click();
      }
      
      // Select sauce
      await page.click('[data-testid="sauce-option"]:first-child');
      
      // Proceed to checkout
      await page.click('button:has-text("Review Order")');
      
      // Verify order summary
      await page.waitForSelector('[data-testid="order-summary"]');
      
      // Enter customer name
      await page.fill('input[placeholder*="name"]', 'QR Test Customer Custom');
      
      // Submit order
      await page.click('button:has-text("Submit Order")');
      
      // Wait for confirmation
      await page.waitForSelector('[data-testid="order-confirmation"]', { timeout: 15000 });
      
      const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
      
      // Verify printer integration
      expect(mockedPrinterService.getPrintCount()).toBe(1);
      
      const printCall = mockedPrinterService.findPrintCallByOrderNumber(orderNumber!);
      expect(printCall?.ticketData.tableNumber).toBe('T-03');
      expect(printCall?.ticketData.location).toBe('Counter');
    });
  });

  test.describe('QR Code Data Validation', () => {
    test('Should generate valid QR codes for all flows', async ({ page }) => {
      const flows = ['three-step', 'single-page', 'custom'];
      
      for (const flow of flows) {
        const qrResponse = await page.request.get(`${BASE_URL}/api/qr/generate?flow=${flow}&table=T-TEST&location=Test%20Area`);
        expect(qrResponse.ok()).toBeTruthy();
        
        const qrData = await qrResponse.json();
        expect(qrData.success).toBeTruthy();
        expect(qrData.data.qrCode).toBeTruthy();
        expect(qrData.data.targetUrl).toContain(`/${flow}`);
        expect(qrData.data.targetUrl).toContain('qrTable=T-TEST');
        expect(qrData.data.targetUrl).toContain('qrLocation=Test%20Area');
      }
    });

    test('Should handle QR parameters in order submission', async ({ page }) => {
      // Create QR URL with specific parameters
      const qrUrl = `${BASE_URL}/three-step?qrTable=TABLE-99&qrLocation=Special%20Event`;
      
      await page.goto(qrUrl);
      await page.waitForSelector('[data-testid="menu-container"]');
      
      // Complete minimal order
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Next")');
      
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Next")');
      
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Review Order")');
      
      await page.fill('input[placeholder*="name"]', 'QR Param Test');
      await page.click('button:has-text("Submit Order")');
      
      await page.waitForSelector('[data-testid="order-confirmation"]');
      const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
      
      // Verify QR parameters were passed to printer
      const printCall = mockedPrinterService.findPrintCallByOrderNumber(orderNumber!);
      expect(printCall?.ticketData.tableNumber).toBe('TABLE-99');
      expect(printCall?.ticketData.location).toBe('Special Event');
    });
  });

  test.describe('Premium Item Badge Validation', () => {
    test('Should display and print premium badges correctly', async ({ page }) => {
      // Use three-step flow to test premium items
      await page.goto(`${BASE_URL}/three-step?qrTable=PREMIUM-TEST`);
      await page.waitForSelector('[data-testid="menu-container"]');
      
      // Select base
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Next")');
      
      // Select sauce
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Next")');
      
      // Look for premium toppings
      const premiumItems = page.locator('[data-testid="menu-item"]').filter({ hasText: 'Premium' });
      const premiumCount = await premiumItems.count();
      
      if (premiumCount > 0) {
        // Click first premium item
        await premiumItems.first().click();
        
        // Verify premium badge appears
        await expect(page.locator('.premium-badge')).toBeVisible();
        
        // Add another premium item if available
        if (premiumCount > 1) {
          await premiumItems.nth(1).click();
        }
      }
      
      // Complete order
      await page.click('button:has-text("Review Order")');
      await page.fill('input[placeholder*="name"]', 'Premium Badge Test');
      await page.click('button:has-text("Submit Order")');
      
      await page.waitForSelector('[data-testid="order-confirmation"]');
      const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
      
      // Verify premium badges in ticket
      if (premiumCount > 0) {
        expect(mockedPrinterService.validatePremiumBadges(orderNumber!)).toBe(true);
      }
    });
  });

  test.describe('Inventory Integration', () => {
    test('Should decrement inventory on order completion', async ({ page }) => {
      // Get initial inventory state
      const inventoryResponse = await page.request.get(`${BASE_URL}/api/inventory`);
      const initialInventory = await inventoryResponse.json();
      
      // Find an item that should be decremented
      const baseItem = initialInventory.data.inventory.find((item: any) => 
        item.name.toLowerCase().includes('vanilla') || item.category === 'base'
      );
      
      if (baseItem) {
        const initialQuantity = baseItem.currentQuantity;
        
        // Place order using that item
        await page.goto(`${BASE_URL}/three-step?qrTable=INVENTORY-TEST`);
        await page.waitForSelector('[data-testid="menu-container"]');
        
        // Find and select the corresponding menu item
        const menuItem = page.locator('[data-testid="menu-item"]').filter({ hasText: 'Vanilla' }).first();
        if (await menuItem.count() > 0) {
          await menuItem.click();
          await page.click('button:has-text("Next")');
          
          // Skip sauce
          await page.click('button:has-text("Next")');
          
          // Skip toppings
          await page.click('button:has-text("Review Order")');
          
          // Complete order
          await page.fill('input[placeholder*="name"]', 'Inventory Test');
          await page.click('button:has-text("Submit Order")');
          
          await page.waitForSelector('[data-testid="order-confirmation"]');
          
          // Check inventory after order
          const updatedInventoryResponse = await page.request.get(`${BASE_URL}/api/inventory`);
          const updatedInventory = await updatedInventoryResponse.json();
          
          const updatedItem = updatedInventory.data.inventory.find((item: any) => item.id === baseItem.id);
          
          // Verify inventory was decremented
          expect(updatedItem.currentQuantity).toBe(initialQuantity - 1);
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('Should handle printer errors gracefully in UI', async ({ page }) => {
      // Configure printer to fail
      mockedPrinterService.simulateError(true, 'E2E test printer error');
      
      await page.goto(`${BASE_URL}/three-step?qrTable=ERROR-TEST`);
      await page.waitForSelector('[data-testid="menu-container"]');
      
      // Complete minimal order
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Next")');
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Next")');
      await page.click('[data-testid="menu-item"]:first-child');
      await page.click('button:has-text("Review Order")');
      
      await page.fill('input[placeholder*="name"]', 'Error Test Customer');
      await page.click('button:has-text("Submit Order")');
      
      // Order should still complete despite printer error
      await page.waitForSelector('[data-testid="order-confirmation"]');
      await expect(page.locator('h1')).toContainText('Order Confirmed');
      
      // Verify print was attempted but failed
      expect(mockedPrinterService.getPrintCount()).toBe(1);
      expect(mockedPrinterService.getPrintCalls()[0].success).toBe(false);
    });
    
    test('Should handle menu loading errors gracefully', async ({ page }) => {
      // Test with invalid flow parameter
      await page.goto(`${BASE_URL}/invalid-flow?qrTable=T-INVALID`);
      
      // Should redirect to home or show error page
      await page.waitForTimeout(3000);
      
      // Check if redirected to home page
      const currentUrl = page.url();
      expect(currentUrl === `${BASE_URL}/` || currentUrl.includes('404')).toBeTruthy();
    });
  });
});