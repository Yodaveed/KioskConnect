import request from 'supertest';
import express from 'express';
import { seedTestData, cleanupTestData } from '../setup';

// Mock express app for testing
const app = express();

describe('Menu Loading API Tests', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/menu', () => {
    it('should load all menu items correctly', async () => {
      const response = await request(app)
        .get('/api/menu')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      const items = response.body.data;
      expect(items.length).toBeGreaterThan(0);
      
      // Verify all items have required fields
      items.forEach((item: any) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('price');
        expect(['base', 'sauce', 'topping', 'pint'].includes(item.category)).toBe(true);
      });
    });

    it('should categorize items correctly', async () => {
      const response = await request(app)
        .get('/api/menu')
        .expect(200);

      const items = response.body.data;
      const categories = {
        base: items.filter((item: any) => item.category === 'base'),
        sauce: items.filter((item: any) => item.category === 'sauce'),
        topping: items.filter((item: any) => item.category === 'topping'),
        pint: items.filter((item: any) => item.category === 'pint'),
      };

      // Verify we have items in each expected category
      expect(categories.base.length).toBeGreaterThan(0);
      expect(categories.sauce.length).toBeGreaterThan(0);
      expect(categories.topping.length).toBeGreaterThan(0);
      expect(categories.pint.length).toBeGreaterThan(0);

      // Verify themed naming convention for toppings
      categories.topping.forEach((topping: any) => {
        expect(topping.name).toMatch(/\([^)]+\)$/); // Should end with (ingredient)
      });
    });

    it('should filter by menuId correctly', async () => {
      const spaghettiMenuId = testData.menus[0].id;
      
      const response = await request(app)
        .get(`/api/menu?menuId=${spaghettiMenuId}`)
        .expect(200);

      const items = response.body.data;
      expect(items.length).toBeGreaterThan(0);
      
      // Should have base, sauce, and topping items but no pints
      const categories = {
        base: items.filter((item: any) => item.category === 'base'),
        sauce: items.filter((item: any) => item.category === 'sauce'),
        topping: items.filter((item: any) => item.category === 'topping'),
        pint: items.filter((item: any) => item.category === 'pint'),
      };

      expect(categories.base.length).toBeGreaterThan(0);
      expect(categories.sauce.length).toBeGreaterThan(0);
      expect(categories.topping.length).toBeGreaterThan(0);
      expect(categories.pint.length).toBe(0); // Pints shouldn't be in spaghetti menu
    });
  });

  describe('GET /api/menu/:category', () => {
    it('should load items by category correctly', async () => {
      const response = await request(app)
        .get('/api/menu/topping')
        .expect(200);

      const items = response.body.data;
      expect(items.length).toBeGreaterThan(0);
      
      // All items should be toppings
      items.forEach((item: any) => {
        expect(item.category).toBe('topping');
        expect(item.name).toMatch(/\([^)]+\)$/); // Themed naming
      });
    });

    it('should filter category by menuId', async () => {
      const spaghettiMenuId = testData.menus[0].id;
      
      const response = await request(app)
        .get(`/api/menu/base?menuId=${spaghettiMenuId}`)
        .expect(200);

      const items = response.body.data;
      expect(items.length).toBeGreaterThan(0);
      
      items.forEach((item: any) => {
        expect(item.category).toBe('base');
      });
    });
  });

  describe('Pricing Rules', () => {
    it('should identify premium items correctly', async () => {
      const response = await request(app)
        .get('/api/menu/topping')
        .expect(200);

      const items = response.body.data;
      const premiumItems = items.filter((item: any) => item.isPremium);
      const regularItems = items.filter((item: any) => !item.isPremium);

      expect(premiumItems.length).toBeGreaterThan(0);
      expect(regularItems.length).toBeGreaterThan(0);

      // Premium items should have higher price
      premiumItems.forEach((item: any) => {
        expect(parseFloat(item.price)).toBeGreaterThan(1.00);
      });
    });
  });
});