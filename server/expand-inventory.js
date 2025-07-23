/**
 * Expand Inventory Script
 * Adds all topping ingredients to inventory system
 * Run: node server/expand-inventory.js
 */

import { db } from './db.ts';
import { menuItems, inventoryItems } from '../shared/schema.ts';
import { eq } from 'drizzle-orm';

async function expandInventoryWithToppings() {
  console.log('🚀 Expanding inventory to include all toppings...\n');

  try {
    // Get all menu items to extract ingredients
    const allMenuItems = await db.select().from(menuItems).where(eq(menuItems.isActive, true));
    console.log(`Found ${allMenuItems.length} active menu items`);

    // Get current inventory
    const currentInventory = await db.select().from(inventoryItems).where(eq(inventoryItems.archived, false));
    const existingNames = new Set(currentInventory.map(item => item.name.toLowerCase()));
    console.log(`Current inventory has ${currentInventory.length} items\n`);

    // Extract all unique ingredients from themed menu items
    const ingredientMap = new Map();
    
    allMenuItems.forEach(item => {
      let actualIngredient = null;
      let category = item.category;
      
      // Extract ingredient from themed names like "Tomatoes (Fresh Strawberry)"
      if (item.name.includes('(') && item.name.includes(')')) {
        const match = item.name.match(/\(([^)]+)\)$/);
        if (match) {
          actualIngredient = match[1].trim();
        }
      } else {
        // Direct names like "Vanilla Pint"
        actualIngredient = item.name;
      }

      if (actualIngredient) {
        const key = actualIngredient.toLowerCase();
        if (!ingredientMap.has(key)) {
          ingredientMap.set(key, {
            name: actualIngredient,
            category: category,
            themedItems: [item.name]
          });
        } else {
          ingredientMap.get(key).themedItems.push(item.name);
        }
      }
    });

    console.log(`Extracted ${ingredientMap.size} unique ingredients from menu items\n`);

    // Create new inventory items for missing ingredients
    const newInventoryItems = [];
    let addedCount = 0;

    for (const [key, ingredient] of ingredientMap) {
      if (!existingNames.has(key)) {
        // Determine appropriate unit and starting quantity based on category
        let unit, quantity, parLevel;
        
        switch (ingredient.category) {
          case 'base':
            unit = 'scoops';
            quantity = 100;
            parLevel = 20;
            break;
          case 'sauce':
            unit = 'oz';
            quantity = 80;
            parLevel = 15;
            break;
          case 'topping':
            unit = 'oz';
            quantity = 50;
            parLevel = 10;
            break;
          case 'pint':
            unit = 'each';
            quantity = 20;
            parLevel = 5;
            break;
          case 'size':
          case 'addon':
            unit = 'each';
            quantity = 100;
            parLevel = 20;
            break;
          default:
            unit = 'each';
            quantity = 50;
            parLevel = 10;
        }

        newInventoryItems.push({
          name: ingredient.name,
          quantity: quantity,
          unit: unit,
          parLevel: parLevel,
          archived: false
        });

        console.log(`+ ${ingredient.name} (${ingredient.category}) - ${quantity} ${unit}`);
        addedCount++;
      } else {
        console.log(`✓ ${ingredient.name} already exists in inventory`);
      }
    }

    // Insert new inventory items
    if (newInventoryItems.length > 0) {
      await db.insert(inventoryItems).values(newInventoryItems);
      console.log(`\n✅ Added ${addedCount} new inventory items`);
    } else {
      console.log('\n✅ All ingredients already exist in inventory');
    }

    // Get final inventory count
    const finalInventory = await db.select().from(inventoryItems).where(eq(inventoryItems.archived, false));
    console.log(`\n📦 Final inventory: ${finalInventory.length} items`);

    // Show category breakdown
    const categoryBreakdown = finalInventory.reduce((acc, item) => {
      // Try to match item to menu categories
      const menuItem = allMenuItems.find(mi => {
        if (mi.name.includes('(') && mi.name.includes(')')) {
          const match = mi.name.match(/\(([^)]+)\)$/);
          return match && match[1].toLowerCase() === item.name.toLowerCase();
        }
        return mi.name.toLowerCase() === item.name.toLowerCase();
      });
      
      const category = menuItem ? menuItem.category : 'other';
      if (!acc[category]) acc[category] = 0;
      acc[category]++;
      return acc;
    }, {});

    console.log('\n=== INVENTORY BY CATEGORY ===');
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      console.log(`${category.toUpperCase()}: ${count} items`);
    });

    console.log('\n🎉 Inventory expansion completed successfully!');

  } catch (error) {
    console.error('❌ Failed to expand inventory:', error);
    throw error;
  }
}

// Run the expansion
expandInventoryWithToppings()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));