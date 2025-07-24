/**
 * API Testing for Admin Dashboard Features
 * Supertest-based API validation for all admin endpoints
 */

import { describe, test, beforeAll, expect } from '@jest/globals';
import request from 'supertest';

const BASE_URL = 'http://localhost:5000';
let authCookie: string;

beforeAll(async () => {
  // Authenticate admin for API tests
  const loginResponse = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  
  authCookie = loginResponse.headers['set-cookie'][0];
});

describe('Admin API Endpoints', () => {
  
  describe('Menu Management APIs', () => {
    let testMenuItemId: number;
    
    test('POST /api/menu-items - Create menu item', async () => {
      const newItem = {
        name: 'API Test Flavor (vanilla)',
        category: 'base',
        price: 6.99,
        description: 'Test flavor for API validation',
        isActive: true,
        sortOrder: 100
      };
      
      const response = await request(BASE_URL)
        .post('/api/menu-items')
        .set('Cookie', authCookie)
        .send(newItem);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newItem.name);
      
      testMenuItemId = response.body.data.id;
    });
    
    test('GET /api/menu-items - Fetch menu items', async () => {
      const response = await request(BASE_URL)
        .get('/api/menu-items')
        .set('Cookie', authCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    test('PUT /api/menu-items/:id - Update menu item', async () => {
      const updateData = {
        name: 'Updated API Test Flavor (vanilla)',
        price: 7.99
      };
      
      const response = await request(BASE_URL)
        .put(`/api/menu-items/${testMenuItemId}`)
        .set('Cookie', authCookie)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.price).toBe(7.99);
    });
    
    test('DELETE /api/menu-items/:id - Delete menu item', async () => {
      const response = await request(BASE_URL)
        .delete(`/api/menu-items/${testMenuItemId}`)
        .set('Cookie', authCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Menu Types APIs', () => {
    let testMenuTypeId: number;
    
    test('POST /api/menus - Create menu type', async () => {
      const newMenuType = {
        name: 'API Test Menu',
        description: 'Test menu for API validation',
        orderingFlow: 'three-step',
        isActive: true,
        sortOrder: 100
      };
      
      const response = await request(BASE_URL)
        .post('/api/menus')
        .set('Cookie', authCookie)
        .send(newMenuType);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newMenuType.name);
      
      testMenuTypeId = response.body.data.id;
    });
    
    test('GET /api/menus - Fetch menu types', async () => {
      const response = await request(BASE_URL)
        .get('/api/menus')
        .set('Cookie', authCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    test('PUT /api/menus/:id - Update menu type', async () => {
      const updateData = {
        name: 'Updated API Test Menu',
        description: 'Updated description'
      };
      
      const response = await request(BASE_URL)
        .put(`/api/menus/${testMenuTypeId}`)
        .set('Cookie', authCookie)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated API Test Menu');
    });
  });

  describe('Orders APIs', () => {
    let testOrderId: number;
    
    test('POST /api/orders - Create order', async () => {
      const newOrder = {
        customerName: 'API Test Customer',
        items: [
          { name: 'Vanilla', price: 5.99, quantity: 2 },
          { name: 'Chocolate', price: 5.99, quantity: 1 }
        ],
        totalAmount: 17.97
      };
      
      const response = await request(BASE_URL)
        .post('/api/orders')
        .send(newOrder);  // Orders don't require auth
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe(newOrder.customerName);
      
      testOrderId = response.body.data.id;
    });
    
    test('GET /api/orders - Fetch orders', async () => {
      const response = await request(BASE_URL)
        .get('/api/orders')
        .set('Cookie', authCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    test('PUT /api/orders/:id/status - Update order status', async () => {
      const response = await request(BASE_URL)
        .put(`/api/orders/${testOrderId}/status`)
        .set('Cookie', authCookie)
        .send({ status: 'fulfilled' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('fulfilled');
    });
  });

  describe('QR Code APIs', () => {
    test('GET /api/qr/generate - Generate QR codes', async () => {
      const flows = ['three-step', 'single-page', 'custom'];
      
      for (const flow of flows) {
        const response = await request(BASE_URL)
          .get(`/api/qr/generate?flow=${flow}`)
          .set('Cookie', authCookie);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.qrCodeUrl).toBeTruthy();
        expect(response.body.data.targetUrl).toContain(flow);
      }
    });
  });

  describe('Manual Entry APIs', () => {
    test('POST /api/orders/manual - Create manual order', async () => {
      const manualOrder = {
        customerName: 'Manual Entry Test',
        items: [
          { name: 'Strawberry', price: 5.99, quantity: 1 },
          { name: 'Vanilla Sauce', price: 1.50, quantity: 1 }
        ],
        totalAmount: 7.49,
        source: 'manual_entry'
      };
      
      const response = await request(BASE_URL)
        .post('/api/orders/manual')
        .set('Cookie', authCookie)
        .send(manualOrder);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe(manualOrder.customerName);
    });
    
    test('POST /api/orders/manual - Validate required fields', async () => {
      const incompleteOrder = {
        customerName: 'Incomplete Test'
        // Missing required fields
      };
      
      const response = await request(BASE_URL)
        .post('/api/orders/manual')
        .set('Cookie', authCookie)
        .send(incompleteOrder);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('Inventory APIs', () => {
    test('GET /api/inventory - Fetch inventory', async () => {
      const response = await request(BASE_URL)
        .get('/api/inventory')
        .set('Cookie', authCookie);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.inventory).toBeTruthy();
      expect(Array.isArray(response.body.data.inventory)).toBe(true);
    });
    
    test('POST /api/inventory-adjustments - Batch inventory adjustments', async () => {
      // Get first inventory item for testing
      const inventoryResponse = await request(BASE_URL)
        .get('/api/inventory')
        .set('Cookie', authCookie);
      
      const firstItem = inventoryResponse.body.data.inventory[0];
      
      const adjustments = [{
        inventoryItemId: firstItem.id,
        adjustment: -5,
        reason: 'API test adjustment',
        note: 'Testing inventory decrement'
      }];
      
      const response = await request(BASE_URL)
        .post('/api/inventory-adjustments')
        .set('Cookie', authCookie)
        .send({ adjustments });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('Unauthorized access returns 401', async () => {
      const response = await request(BASE_URL)
        .get('/api/menu-items');
      
      expect(response.status).toBe(401);
    });
    
    test('Invalid data returns 400', async () => {
      const response = await request(BASE_URL)
        .post('/api/menu-items')
        .set('Cookie', authCookie)
        .send({ invalidField: 'invalidValue' });
      
      expect(response.status).toBe(400);
    });
    
    test('Non-existent resources return 404', async () => {
      const response = await request(BASE_URL)
        .get('/api/menu-items/99999')
        .set('Cookie', authCookie);
      
      expect(response.status).toBe(404);
    });
  });
});