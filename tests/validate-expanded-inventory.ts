/**
 * Validate Expanded Inventory
 * Confirms all menu items have corresponding inventory entries
 */

import { db } from '../server/db';
import { menuItems, inventoryItems } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function validateExpandedInventory() {
  console.log('🔍 VALIDATING EXPANDED INVENTORY WITH TOPPINGS\n');

  try {
    // Get all active menu items
    const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.isActive, true));
    const inventory = await db.select().from(inventoryItems).where(eq(inventoryItems.archived, false));

    console.log(`Menu items: ${allMenuItems.length}`);
    console.log(`Inventory items: ${inventory.length}\n`);

    // Create mapping of inventory names (lowercase for matching)
    const inventoryNames = new Set(inventory.map(item => item.name.toLowerCase()));

    // Check each menu item for inventory mapping
    const categoryMappings = {
      base: { mapped: 0, unmapped: [] },
      sauce: { mapped: 0, unmapped: [] },
      topping: { mapped: 0, unmapped: [] },
      other: { mapped: 0, unmapped: [] }
    };

    for (const menuItem of allMenuItems) {
      let actualIngredient = null;
      let category = menuItem.category;

      // Extract ingredient from themed names
      if (menuItem.name.includes('(') && menuItem.name.includes(')')) {
        const match = menuItem.name.match(/\(([^)]+)\)$/);
        if (match) {
          actualIngredient = match[1].trim().toLowerCase();
        }
      } else {
        actualIngredient = menuItem.name.toLowerCase();
      }

      const categoryKey = ['base', 'sauce', 'topping'].includes(category) ? category : 'other';
      
      if (actualIngredient && inventoryNames.has(actualIngredient)) {
        categoryMappings[categoryKey].mapped++;
      } else {
        categoryMappings[categoryKey].unmapped.push({
          menuItem: menuItem.name,
          ingredient: actualIngredient,
          category: category
        });
      }
    }

    // Report results
    console.log('=== INVENTORY MAPPING VALIDATION ===');
    
    for (const [category, data] of Object.entries(categoryMappings)) {
      const total = data.mapped + data.unmapped.length;
      if (total > 0) {
        const percentage = Math.round((data.mapped / total) * 100);
        console.log(`\n${category.toUpperCase()}: ${data.mapped}/${total} mapped (${percentage}%)`);
        
        if (data.unmapped.length > 0) {
          console.log('  Unmapped items:');
          data.unmapped.forEach(item => {
            console.log(`    - ${item.menuItem} → "${item.ingredient}"`);
          });
        }
      }
    }

    // Show inventory breakdown by category
    console.log('\n=== INVENTORY BREAKDOWN ===');
    const inventoryByCategory = inventory.reduce((acc, item) => {
      // Try to categorize inventory items
      const name = item.name.toLowerCase();
      let cat = 'other';
      
      if (['vanilla', 'chocolate', 'strawberry', 'cookies', 'pistachio'].some(x => name.includes(x))) {
        cat = 'base';
      } else if (['sauce', 'white chocolate', 'carmel', 'puree', 'raspberry'].some(x => name.includes(x))) {
        cat = 'sauce';
      } else if (['sprinkles', 'banana', 'fish', 'cream', 'coconut', 'almonds', 'worms', 'brownie', 'gummy', 'reese', 'ferrero', 'pecans'].some(x => name.includes(x))) {
        cat = 'topping';
      }
      
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(`${item.name} (${item.quantity} ${item.unit})`);
      return acc;
    }, {});

    for (const [category, items] of Object.entries(inventoryByCategory)) {
      console.log(`\n${category.toUpperCase()}: ${items.length} items`);
      items.forEach(item => console.log(`  - ${item}`));
    }

    const totalMapped = Object.values(categoryMappings).reduce((sum, cat) => sum + cat.mapped, 0);
    const totalItems = Object.values(categoryMappings).reduce((sum, cat) => sum + cat.mapped + cat.unmapped.length, 0);
    const overallPercentage = Math.round((totalMapped / totalItems) * 100);

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total menu items: ${totalItems}`);
    console.log(`Items with inventory: ${totalMapped} (${overallPercentage}%)`);
    console.log(`Inventory size: ${inventory.length} items`);

    if (overallPercentage >= 90) {
      console.log('✅ EXCELLENT: Inventory coverage is comprehensive');
    } else if (overallPercentage >= 70) {
      console.log('⚠️  GOOD: Most items have inventory coverage');
    } else {
      console.log('❌ NEEDS WORK: Many items lack inventory coverage');
    }

  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}

// ES module check
if (import.meta.url === `file://${process.argv[1]}`) {
  validateExpandedInventory()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { validateExpandedInventory };