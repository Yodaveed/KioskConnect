// Script to extract actual ingredient names from menu items and update inventory
const { db } = require('./db.ts');
const { menuItems, inventoryItems } = require('../shared/schema.ts');

async function extractIngredientNames() {
  try {
    console.log('Fetching menu items...');
    const allMenuItems = await db.select().from(menuItems);
    
    const ingredientMap = new Map();
    
    allMenuItems.forEach(item => {
      const name = item.name;
      const match = name.match(/\(([^)]+)\)$/); // Extract text in final parentheses
      
      if (match) {
        const actualName = match[1].trim();
        const category = item.category;
        
        // Key by actual ingredient name
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
        // No parentheses, use the name as-is
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
    
    console.log('Ingredient mapping:');
    for (const [key, value] of ingredientMap.entries()) {
      console.log(`${value.actualName} (${value.category})`);
      console.log(`  Used in: ${value.themedNames.join(', ')}`);
      console.log('---');
    }
    
    return Array.from(ingredientMap.values());
  } catch (error) {
    console.error('Error extracting ingredient names:', error);
    throw error;
  }
}

module.exports = { extractIngredientNames };