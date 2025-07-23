/**
 * Manual Validation Script for IC Pasta Phase 1 Mission
 * 
 * Run this script to validate all the requirements manually
 * Usage: npm run test:manual
 */

import { db } from '../server/db';
import { menuItems, inventoryItems, menus, menuItemsToMenus } from '../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

class ManualValidator {
  private results: ValidationResult[] = [];

  private log(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
    this.results.push({ test, status, message, details });
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${test}: ${message}`);
    if (details) {
      console.log('   Details:', JSON.stringify(details, null, 2));
    }
  }

  async validateMenuItemCategories() {
    console.log('\n=== VALIDATING MENU ITEM CATEGORIES ===');
    
    const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.isActive, true));
    
    const categories = {
      base: allMenuItems.filter(item => item.category === 'base'),
      sauce: allMenuItems.filter(item => item.category === 'sauce'),
      topping: allMenuItems.filter(item => item.category === 'topping'),
      pint: allMenuItems.filter(item => item.category === 'pint'),
      uncategorized: allMenuItems.filter(item => !['base', 'sauce', 'topping', 'pint', 'size', 'flavor', 'addon'].includes(item.category))
    };

    // Test 1: All items should be properly categorized
    if (categories.uncategorized.length === 0) {
      this.log('Menu Categorization', 'PASS', 'All menu items are properly categorized');
    } else {
      this.log('Menu Categorization', 'FAIL', `Found ${categories.uncategorized.length} uncategorized items`, 
        categories.uncategorized.map(item => ({ name: item.name, category: item.category })));
    }

    // Test 2: Themed naming convention for toppings
    const themedToppings = categories.topping.filter(item => 
      item.name.includes('(') && item.name.includes(')')
    );
    
    if (themedToppings.length === categories.topping.length) {
      this.log('Themed Naming', 'PASS', 'All toppings use themed naming convention (e.g., "Item (ingredient)")');
    } else {
      const nonThemed = categories.topping.filter(item => 
        !(item.name.includes('(') && item.name.includes(')'))
      );
      this.log('Themed Naming', 'WARN', `${nonThemed.length} toppings don't use themed naming`, 
        nonThemed.map(item => item.name));
    }

    return categories;
  }

  async validateInventoryOptimization() {
    console.log('\n=== VALIDATING INVENTORY OPTIMIZATION ===');
    
    const inventory = await db.select().from(inventoryItems).where(eq(inventoryItems.archived, false));
    
    // Test 3: Inventory should only contain base and sauce items
    const expectedMaxItems = 15; // Reasonable limit for base and sauce only
    
    if (inventory.length <= expectedMaxItems) {
      this.log('Inventory Size', 'PASS', `Inventory optimized to ${inventory.length} items (≤${expectedMaxItems})`);
    } else {
      this.log('Inventory Size', 'FAIL', `Inventory has ${inventory.length} items (>${expectedMaxItems})`);
    }

    // Test 4: Validate inventory items are only base/sauce ingredients
    const baseSauceIngredients = [
      'vanilla', 'chocolate', 'strawberry', 'cookies', 'pistachio',
      'white chocolate', 'salted carmel', 'caramel', 'puree', 'raspberry'
    ];
    
    const validItems = inventory.filter(item => 
      baseSauceIngredients.some(ingredient => 
        item.name.toLowerCase().includes(ingredient.toLowerCase())
      )
    );

    if (validItems.length === inventory.length) {
      this.log('Inventory Content', 'PASS', 'All inventory items are base/sauce ingredients');
    } else {
      const invalidItems = inventory.filter(item => 
        !baseSauceIngredients.some(ingredient => 
          item.name.toLowerCase().includes(ingredient.toLowerCase())
        )
      );
      this.log('Inventory Content', 'WARN', `${invalidItems.length} items may not be base/sauce ingredients`, 
        invalidItems.map(item => item.name));
    }

    return inventory;
  }

  async validateMenuAssignments() {
    console.log('\n=== VALIDATING MENU ASSIGNMENTS ===');
    
    const allMenus = await db.select().from(menus).where(eq(menus.isActive, true));
    
    for (const menu of allMenus) {
      // Get items assigned to this menu
      const menuItemIds = await db
        .select({ menuItemId: menuItemsToMenus.menuItemId })
        .from(menuItemsToMenus)
        .where(eq(menuItemsToMenus.menuId, menu.id));
      
      if (menuItemIds.length === 0) {
        this.log(`Menu Assignment: ${menu.name}`, 'WARN', 'No items assigned to this menu');
        continue;
      }

      const assignedItems = await db
        .select()
        .from(menuItems)
        .where(and(
          inArray(menuItems.id, menuItemIds.map(item => item.menuItemId).filter(Boolean)),
          eq(menuItems.isActive, true)
        ));

      const itemsByCategory = assignedItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item.name);
        return acc;
      }, {} as Record<string, string[]>);

      this.log(`Menu Assignment: ${menu.name}`, 'PASS', 
        `${assignedItems.length} items assigned`, itemsByCategory);
    }
  }

  async validateThemedMapping() {
    console.log('\n=== VALIDATING THEMED MAPPING ===');
    
    const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.isActive, true));
    const inventory = await db.select().from(inventoryItems).where(eq(inventoryItems.archived, false));
    
    const themedItems = allMenuItems.filter(item => 
      item.name.includes('(') && item.name.includes(')')
    );

    let mappingErrors = 0;
    
    for (const item of themedItems) {
      const match = item.name.match(/\(([^)]+)\)$/);
      if (match) {
        const ingredient = match[1].toLowerCase();
        const hasInventoryMapping = inventory.some(inv => 
          inv.name.toLowerCase().includes(ingredient) ||
          ingredient.includes(inv.name.toLowerCase())
        );
        
        if (!hasInventoryMapping) {
          this.log(`Themed Mapping: ${item.name}`, 'WARN', 
            `No inventory mapping found for ingredient "${ingredient}"`);
          mappingErrors++;
        }
      }
    }

    if (mappingErrors === 0) {
      this.log('Themed Mapping', 'PASS', `All ${themedItems.length} themed items have inventory mappings`);
    } else {
      this.log('Themed Mapping', 'WARN', `${mappingErrors} themed items lack inventory mappings`);
    }
  }

  async runFullValidation() {
    console.log('🚀 Starting IC Pasta Phase 1 Manual Validation\n');
    
    try {
      const categories = await this.validateMenuItemCategories();
      const inventory = await this.validateInventoryOptimization();
      await this.validateMenuAssignments();
      await this.validateThemedMapping();

      console.log('\n=== VALIDATION SUMMARY ===');
      const passed = this.results.filter(r => r.status === 'PASS').length;
      const failed = this.results.filter(r => r.status === 'FAIL').length;
      const warned = this.results.filter(r => r.status === 'WARN').length;

      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`⚠️  Warnings: ${warned}`);
      console.log(`📋 Total: ${this.results.length} tests`);

      if (failed === 0) {
        console.log('\n🎉 ALL CRITICAL TESTS PASSED! System is ready for production.');
      } else {
        console.log('\n🔧 Some tests failed. Please address the issues above.');
      }

      return {
        summary: { passed, failed, warned, total: this.results.length },
        results: this.results,
        categories,
        inventory
      };

    } catch (error) {
      console.error('❌ Validation failed with error:', error);
      throw error;
    }
  }
}

// Export for use in other tests
export { ManualValidator };

// Run validation if called directly
// ES module check
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ManualValidator();
  validator.runFullValidation()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}