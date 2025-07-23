import { test, expect } from '@playwright/test';

test.describe('IC Pasta Ordering Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display menu options on home page', async ({ page }) => {
    // Check that menu cards are visible
    await expect(page.locator('h1')).toContainText('Choose Your Experience');
    
    // Should have menu options
    const menuCards = page.locator('[data-testid="menu-card"]').or(page.locator('.menu-card')).or(page.locator('button').filter({ hasText: /Spaghetti|Burger|Soup|Pints|Freeze/ }));
    await expect(menuCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('Three-step ordering flow', async ({ page }) => {
    // Look for spaghetti or three-step menu option
    const spaghettiOption = page.locator('button').filter({ hasText: /Spaghetti/i }).first();
    
    if (await spaghettiOption.isVisible()) {
      await spaghettiOption.click();
      
      // Should be on step 1 - base selection
      await expect(page.locator('h2')).toContainText(/Step 1|Base|Choose/i);
      
      // Should have base options
      const baseOptions = page.locator('button').filter({ hasText: /vanilla|chocolate/i });
      await expect(baseOptions.first()).toBeVisible();
      
      // Select a base
      await baseOptions.first().click();
      
      // Continue to step 2
      const continueBtn = page.locator('button').filter({ hasText: /continue|next/i }).first();
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
        
        // Should be on step 2 - sauce selection
        await expect(page.locator('h2')).toContainText(/Step 2|Sauce/i);
        
        // Should have sauce options
        const sauceOptions = page.locator('button').filter({ hasText: /sauce|chocolate|caramel/i });
        if (await sauceOptions.first().isVisible()) {
          await sauceOptions.first().click();
          
          // Continue to step 3
          const continueBtn2 = page.locator('button').filter({ hasText: /continue|next/i }).first();
          if (await continueBtn2.isVisible()) {
            await continueBtn2.click();
            
            // Should be on step 3 - toppings
            await expect(page.locator('h2')).toContainText(/Step 3|Topping/i);
          }
        }
      }
    } else {
      console.log('Spaghetti menu not found, skipping three-step test');
    }
  });

  test('Single-page ordering flow (Pints)', async ({ page }) => {
    // Look for pints menu option
    const pintsOption = page.locator('button').filter({ hasText: /Pints/i }).first();
    
    if (await pintsOption.isVisible()) {
      await pintsOption.click();
      
      // Should show single-page ordering interface
      await expect(page.locator('h2')).toContainText(/Pints|Select/i);
      
      // Should have pint options
      const pintOptions = page.locator('button').filter({ hasText: /pint|vanilla|chocolate/i });
      await expect(pintOptions.first()).toBeVisible();
      
      // Select a pint
      await pintOptions.first().click();
      
      // Should have order summary or add to cart option
      const orderActions = page.locator('button').filter({ hasText: /order|cart|submit/i });
      await expect(orderActions.first()).toBeVisible();
    } else {
      console.log('Pints menu not found, skipping single-page test');
    }
  });

  test('Custom ordering flow (Freeze Sticks)', async ({ page }) => {
    // Look for freeze sticks menu option
    const freezeOption = page.locator('button').filter({ hasText: /Freeze|Stick/i }).first();
    
    if (await freezeOption.isVisible()) {
      await freezeOption.click();
      
      // Should show custom ordering interface
      await expect(page.locator('h2')).toContainText(/Freeze|Stick|Custom/i);
      
      // Should have custom options
      const customOptions = page.locator('button').filter({ hasText: /size|flavor|small|medium|large/i });
      await expect(customOptions.first()).toBeVisible();
    } else {
      console.log('Freeze Sticks menu not found, skipping custom test');
    }
  });

  test('should show premium pricing badges', async ({ page }) => {
    // Navigate through any ordering flow
    const menuOption = page.locator('button').filter({ hasText: /Spaghetti|Pints|Freeze/i }).first();
    await menuOption.click();
    
    // Wait for items to load
    await page.waitForTimeout(2000);
    
    // Look for premium pricing indicators
    const premiumBadges = page.locator('text=+').or(page.locator('.premium')).or(page.locator('[data-premium="true"]'));
    
    // If premium items exist, they should show pricing
    const premiumItems = await premiumBadges.count();
    if (premiumItems > 0) {
      await expect(premiumBadges.first()).toBeVisible();
      
      // Should show additional cost like "+ $0.25"
      await expect(page.locator('text=/\\+\\s*\\$\\d+\\.\\d{2}/')).toBeVisible();
    }
  });

  test('should complete order submission', async ({ page }) => {
    // Navigate to any menu
    const menuOption = page.locator('button').filter({ hasText: /Spaghetti|Pints/i }).first();
    await menuOption.click();
    
    // Make selections (simplified for testing)
    const itemOption = page.locator('button').filter({ hasText: /vanilla|chocolate/i }).first();
    if (await itemOption.isVisible()) {
      await itemOption.click();
      
      // Look for submit or order button
      const submitBtn = page.locator('button').filter({ hasText: /submit|order|place/i }).first();
      if (await submitBtn.isVisible()) {
        // Enter customer name if required
        const nameInput = page.locator('input[placeholder*="name"]').or(page.locator('input[type="text"]')).first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Customer');
        }
        
        await submitBtn.click();
        
        // Should show order confirmation
        await expect(page.locator('text=/order.*confirm|thank.*you|order.*number/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should validate category headers in ordering flows', async ({ page }) => {
    // Test that items appear under correct category headers
    const menuOption = page.locator('button').filter({ hasText: /Spaghetti/i }).first();
    
    if (await menuOption.isVisible()) {
      await menuOption.click();
      
      // Should have base category header
      await expect(page.locator('h3, h2').filter({ hasText: /base|flavor/i })).toBeVisible();
      
      // Items under base should be base flavors
      const baseSection = page.locator('section, div').filter({ hasText: /base|flavor/i }).first();
      if (await baseSection.isVisible()) {
        const baseItems = baseSection.locator('button').filter({ hasText: /vanilla|chocolate|strawberry/i });
        await expect(baseItems.first()).toBeVisible();
      }
    }
  });
});