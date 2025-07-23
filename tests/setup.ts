import { db } from '../server/db';
import { users, menus, menuItems, menuItemsToMenus, inventoryItems } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Global test setup
beforeAll(async () => {
  // Setup test database
  console.log('Setting up test database...');
});

afterAll(async () => {
  // Cleanup after all tests
  console.log('Cleaning up test database...');
});

export async function seedTestData() {
  // Clear existing data
  await db.delete(menuItemsToMenus);
  await db.delete(menuItems);
  await db.delete(menus);
  await db.delete(inventoryItems);
  
  // Create admin user if not exists
  const existingAdmin = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      username: 'admin',
      password: 'admin123',
      isAdmin: true
    });
  }

  // Create test menus
  const [spaghettiMenu] = await db.insert(menus).values({
    name: 'Test Spaghetti',
    description: 'Three-step ordering flow',
    orderingFlow: 'three-step',
    sortOrder: 1,
    isActive: true
  }).returning();

  const [pintsMenu] = await db.insert(menus).values({
    name: 'Test Pints',
    description: 'Single-page ordering flow',
    orderingFlow: 'single-page',
    sortOrder: 2,
    isActive: true
  }).returning();

  const [customMenu] = await db.insert(menus).values({
    name: 'Test Custom',
    description: 'Custom ordering flow',
    orderingFlow: 'custom',
    sortOrder: 3,
    isActive: true
  }).returning();

  // Create at least one item in each category for testing
  const testItems = [
    // Base items
    { name: 'Test Base Vanilla (vanilla)', category: 'base', price: '8.99', isActive: true },
    { name: 'Test Base Chocolate (chocolate)', category: 'base', price: '8.99', isActive: true },
    
    // Sauce items
    { name: 'Test Sauce Hot Fudge (chocolate)', category: 'sauce', price: '1.50', isActive: true },
    { name: 'Test Sauce Caramel (caramel)', category: 'sauce', price: '1.50', isActive: true },
    
    // Topping items (with themed names)
    { name: 'Test Sprinkles (sprinkles)', category: 'topping', price: '0.75', isActive: true },
    { name: 'Test Nuts (almonds)', category: 'topping', price: '1.25', isPremium: true, isActive: true },
    { name: 'Test Chocolate Chips (chocolate chips)', category: 'topping', price: '1.00', isActive: true },
    
    // Pint items
    { name: 'Test Pint Vanilla', category: 'pint', price: '12.99', isActive: true },
  ];

  const createdItems = [];
  for (const item of testItems) {
    const [createdItem] = await db.insert(menuItems).values(item).returning();
    createdItems.push(createdItem);
  }

  // Assign items to appropriate menus
  const assignments = [
    // Spaghetti menu gets base, sauce, and toppings
    { menuItemId: createdItems[0].id, menuId: spaghettiMenu.id }, // vanilla base
    { menuItemId: createdItems[1].id, menuId: spaghettiMenu.id }, // chocolate base
    { menuItemId: createdItems[2].id, menuId: spaghettiMenu.id }, // hot fudge sauce
    { menuItemId: createdItems[3].id, menuId: spaghettiMenu.id }, // caramel sauce
    { menuItemId: createdItems[4].id, menuId: spaghettiMenu.id }, // sprinkles topping
    { menuItemId: createdItems[5].id, menuId: spaghettiMenu.id }, // nuts topping (premium)
    { menuItemId: createdItems[6].id, menuId: spaghettiMenu.id }, // chocolate chips topping
    
    // Pints menu gets only pint items
    { menuItemId: createdItems[7].id, menuId: pintsMenu.id },
    
    // Custom menu gets base and sauce
    { menuItemId: createdItems[0].id, menuId: customMenu.id },
    { menuItemId: createdItems[2].id, menuId: customMenu.id },
  ];

  await db.insert(menuItemsToMenus).values(assignments);

  // Seed corresponding inventory items (only base and sauce)
  const inventorySeeds = [
    { name: 'vanilla', quantity: 100, unit: 'oz', parLevel: 20 },
    { name: 'chocolate', quantity: 100, unit: 'oz', parLevel: 20 },
    { name: 'caramel', quantity: 50, unit: 'oz', parLevel: 10 },
  ];

  await db.insert(inventoryItems).values(inventorySeeds);

  return {
    menus: [spaghettiMenu, pintsMenu, customMenu],
    items: createdItems,
  };
}

export async function cleanupTestData() {
  await db.delete(menuItemsToMenus);
  await db.delete(menuItems);
  await db.delete(menus);
  await db.delete(inventoryItems);
}