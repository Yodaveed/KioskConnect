// Script to populate inventory with current menu items
// Run with: node populate-inventory.js

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon for serverless
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Menu item to inventory mappings
const INVENTORY_MAPPINGS = {
  // Base items
  'vanilla': 'vanilla',
  'chocolate': 'chocolate', 
  'strawberry': 'strawberry',
  'mint chip': 'mint chip',
  'cookies & cream': 'cookies and cream',
  'turkey burger': 'vanilla', // Special mapping as requested
  
  // Sauces
  'hot fudge': 'hot fudge sauce',
  'caramel': 'caramel sauce',
  'strawberry sauce': 'strawberry sauce',
  'chocolate sauce': 'chocolate sauce',
  
  // Toppings
  'sprinkles': 'sprinkles',
  'whipped cream': 'whipped cream',
  'brownie': 'brownie pieces',
  'cookie dough': 'cookie dough pieces',
  'nuts': 'mixed nuts',
  'cherry': 'maraschino cherries',
  'gummy bears': 'gummy bears',
  
  // Size modifiers
  'small': 'small containers',
  'medium': 'medium containers', 
  'large': 'large containers',
  
  // Freeze stick items
  'freeze stick': 'freeze stick molds',
  'stick wrapper': 'stick wrappers'
};

async function populateInventory() {
  const client = await pool.connect();
  
  try {
    console.log('Starting inventory population...');
    
    // Get all menu items
    const menuItemsResult = await client.query(`
      SELECT DISTINCT name, category 
      FROM menu_items 
      WHERE is_active = true
    `);
    
    const menuItems = menuItemsResult.rows;
    console.log(`Found ${menuItems.length} active menu items`);
    
    // Create inventory items based on menu items
    const inventoryItems = new Map();
    
    for (const item of menuItems) {
      const itemName = item.name.toLowerCase();
      const inventoryName = INVENTORY_MAPPINGS[itemName] || item.name;
      
      if (!inventoryItems.has(inventoryName)) {
        let unit = 'units';
        let parLevel = 10;
        let initialQuantity = 50;
        
        // Set appropriate units and quantities based on category
        switch (item.category) {
          case 'base':
          case 'flavor':
            unit = 'scoops';
            parLevel = 20;
            initialQuantity = 100;
            break;
          case 'sauce':
            unit = 'portions';
            parLevel = 15;
            initialQuantity = 75;
            break;
          case 'topping':
          case 'addon':
            unit = 'servings';
            parLevel = 10;
            initialQuantity = 50;
            break;
          case 'size':
            unit = 'containers';
            parLevel = 25;
            initialQuantity = 100;
            break;
        }
        
        inventoryItems.set(inventoryName, {
          name: inventoryName,
          quantity: initialQuantity,
          unit: unit,
          parLevel: parLevel
        });
      }
    }
    
    console.log(`Creating ${inventoryItems.size} inventory items...`);
    
    // Insert inventory items
    for (const [name, item] of inventoryItems) {
      try {
        await client.query(`
          INSERT INTO inventory_items (name, quantity, unit, par_level, archived, created_at, updated_at)
          VALUES ($1, $2, $3, $4, false, NOW(), NOW())
          ON CONFLICT (name) DO UPDATE SET
            quantity = EXCLUDED.quantity,
            unit = EXCLUDED.unit,
            par_level = EXCLUDED.par_level,
            updated_at = NOW()
        `, [item.name, item.quantity, item.unit, item.parLevel]);
        
        console.log(`✓ ${item.name} (${item.quantity} ${item.unit})`);
      } catch (error) {
        console.error(`✗ Failed to create ${item.name}:`, error.message);
      }
    }
    
    console.log('\nInventory population completed!');
    console.log('\nSpecial mappings applied:');
    console.log('- "turkey burger" → "vanilla" inventory');
    
  } catch (error) {
    console.error('Error populating inventory:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
populateInventory().catch(console.error);