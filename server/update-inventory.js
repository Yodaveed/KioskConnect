// Node.js script to update inventory with actual ingredient names
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function updateInventoryWithActualNames() {
  const client = await pool.connect();
  
  try {
    // Get all menu items
    const menuResult = await client.query('SELECT id, name, category FROM menu_items');
    const menuItems = menuResult.rows;
    
    // Extract ingredient mapping
    const ingredientMap = new Map();
    
    menuItems.forEach(item => {
      const name = item.name;
      const match = name.match(/\(([^)]+)\)$/);
      
      if (match) {
        const actualName = match[1].trim();
        const category = item.category;
        const key = `${actualName}_${category}`;
        
        if (!ingredientMap.has(key)) {
          ingredientMap.set(key, {
            actualName,
            category,
            themedNames: [name]
          });
        } else {
          ingredientMap.get(key).themedNames.push(name);
        }
      } else {
        const key = `${name}_${item.category}`;
        if (!ingredientMap.has(key)) {
          ingredientMap.set(key, {
            actualName: name,
            category: item.category,
            themedNames: [name]
          });
        }
      }
    });

    console.log('Found', ingredientMap.size, 'unique ingredients');

    // Clear existing inventory items (keeping structure)
    await client.query('DELETE FROM inventory_items');
    console.log('Cleared existing inventory');

    // Insert new inventory items based on actual ingredient names
    for (const ingredient of ingredientMap.values()) {
      const { actualName, category } = ingredient;
      
      // Set default quantities based on category
      let quantity = 50;
      let unit = 'units';
      let parLevel = 10;
      
      if (category === 'base') {
        unit = 'scoops';
        quantity = 100;
        parLevel = 20;
      } else if (category === 'sauce') {
        unit = 'portions';
        quantity = 80;
        parLevel = 15;
      } else if (category === 'topping') {
        unit = 'portions';
        quantity = 60;
        parLevel = 12;
      }

      await client.query(`
        INSERT INTO inventory_items (name, category, quantity, unit, par_level, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [actualName, category, quantity, unit, parLevel]);
      
      console.log(`Added: ${actualName} (${category})`);
    }

    console.log('Inventory updated successfully!');
    
  } catch (error) {
    console.error('Error updating inventory:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the update
if (require.main === module) {
  updateInventoryWithActualNames()
    .then(() => {
      console.log('Inventory update completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to update inventory:', error);
      process.exit(1);
    });
}

module.exports = { updateInventoryWithActualNames };