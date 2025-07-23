import request from 'supertest';
import express from 'express';
import { seedTestData, cleanupTestData } from '../setup';

// Mock express app for testing
const app = express();

describe('Inventory Management API Tests', () => {
  let authCookie: string;
  let testData: any;

  beforeAll(async () => {
    testData = await seedTestData();
    
    // Login to get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(200);
    
    authCookie = loginResponse.get('Set-Cookie')[0];
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/inventory', () => {
    it('should return only base and sauce inventory items', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body.success).toBe(true);
      const inventory = response.body.data.inventory;
      
      expect(Array.isArray(inventory)).toBe(true);
      expect(inventory.length).toBeGreaterThan(0);

      // Should only contain base flavor and sauce ingredients
      inventory.forEach((item: any) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('unit');
        
        // Should be base flavors or sauce ingredients
        const name = item.name.toLowerCase();
        const isBaseFlavor = ['vanilla', 'chocolate', 'strawberry'].some(flavor => 
          name.includes(flavor)
        );
        const isSauce = ['caramel', 'fudge', 'sauce'].some(sauce => 
          name.includes(sauce)
        );
        
        expect(isBaseFlavor || isSauce).toBe(true);
      });
    });

    it('should not include toppings or sizes in inventory', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Cookie', authCookie)
        .expect(200);

      const inventory = response.body.data.inventory;
      
      // Should not contain typical topping ingredients
      const toppingIngredients = ['sprinkles', 'nuts', 'chips', 'cherry'];
      inventory.forEach((item: any) => {
        const name = item.name.toLowerCase();
        toppingIngredients.forEach(topping => {
          expect(name).not.toContain(topping);
        });
      });
    });
  });

  describe('Inventory-Menu Mapping', () => {
    it('should map themed menu items to correct inventory ingredients', async () => {
      // Get menu items with themed names
      const menuResponse = await request(app)
        .get('/api/menu/base')
        .expect(200);
      
      const baseItems = menuResponse.body.data;
      const themedItems = baseItems.filter((item: any) => 
        item.name.includes('(') && item.name.includes(')')
      );

      expect(themedItems.length).toBeGreaterThan(0);

      // Get inventory
      const inventoryResponse = await request(app)
        .get('/api/inventory')
        .set('Cookie', authCookie)
        .expect(200);
      
      const inventory = inventoryResponse.body.data.inventory;

      // Verify themed items map to inventory ingredients
      themedItems.forEach((item: any) => {
        const match = item.name.match(/\(([^)]+)\)$/);
        expect(match).toBeTruthy();
        
        if (match) {
          const ingredient = match[1].toLowerCase();
          const hasInventoryItem = inventory.some((inv: any) => 
            inv.name.toLowerCase().includes(ingredient)
          );
          expect(hasInventoryItem).toBe(true);
        }
      });
    });
  });

  describe('Inventory Adjustments', () => {
    it('should track inventory changes when orders are placed', async () => {
      // Get initial inventory state
      const initialResponse = await request(app)
        .get('/api/inventory')
        .set('Cookie', authCookie)
        .expect(200);
      
      const initialInventory = initialResponse.body.data.inventory;
      const vanillaItem = initialInventory.find((item: any) => 
        item.name.toLowerCase().includes('vanilla')
      );
      
      expect(vanillaItem).toBeTruthy();
      const initialQuantity = vanillaItem.quantity;

      // Place an order that uses vanilla
      const orderResponse = await request(app)
        .post('/api/orders')
        .send({
          customerName: 'Test Customer',
          items: [
            {
              name: 'Test Base Vanilla (vanilla)',
              category: 'base',
              price: 8.99,
              quantity: 1
            }
          ],
          totalAmount: 8.99
        })
        .expect(201);

      expect(orderResponse.body.success).toBe(true);

      // Check inventory was decremented
      const updatedResponse = await request(app)
        .get('/api/inventory')
        .set('Cookie', authCookie)
        .expect(200);
      
      const updatedInventory = updatedResponse.body.data.inventory;
      const updatedVanillaItem = updatedInventory.find((item: any) => 
        item.name.toLowerCase().includes('vanilla')
      );
      
      expect(updatedVanillaItem.quantity).toBeLessThan(initialQuantity);
    });
  });
});