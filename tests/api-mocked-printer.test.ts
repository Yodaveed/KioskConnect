/**
 * PHASE 3A: API Tests for Mocked Printer Integration
 * Jest + Supertest validation of printer pipeline
 */

import { describe, test, beforeAll, afterEach, beforeEach, expect } from '@jest/globals';
import request from 'supertest';
import { mockedPrinterService } from '../server/mocked-printer';

const BASE_URL = 'http://localhost:5000';
let authCookie: string;

// Set test environment to enable mocked printer
process.env.NODE_ENV = 'test';

beforeAll(async () => {
  // Authenticate admin for API tests
  const loginResponse = await request(BASE_URL)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  
  authCookie = loginResponse.headers['set-cookie'][0];
});

beforeEach(() => {
  // Reset mock printer state before each test
  mockedPrinterService.reset();
});

describe('Phase 3A: Mocked Printer Integration', () => {
  
  describe('Order Placement Print Trigger', () => {
    test('Should automatically print receipt on order placement', async () => {
      const testOrder = {
        customerName: 'Print Test Customer',
        items: [
          { name: 'Vanilla Base', price: 5.99, quantity: 1, category: 'base' },
          { name: 'Chocolate Sauce', price: 1.50, quantity: 1, category: 'sauce', isPremium: true }
        ],
        totalAmount: 7.49,
        menuType: 'Three-Step Ice Cream'
      };
      
      // Submit order and verify it triggers print
      const response = await request(BASE_URL)
        .post('/api/orders')
        .send(testOrder);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      const orderNumber = response.body.data.orderNumber;
      
      // Verify print was called exactly once
      expect(mockedPrinterService.getPrintCount()).toBe(1);
      
      // Verify print call contains correct data
      const printCall = mockedPrinterService.findPrintCallByOrderNumber(orderNumber);
      expect(printCall).toBeDefined();
      expect(printCall?.success).toBe(true);
      expect(printCall?.ticketData.customerName).toBe('Print Test Customer');
      expect(printCall?.ticketData.orderNumber).toBe(orderNumber);
    });

    test('Should format ticket correctly with customer info and items', async () => {
      const testOrder = {
        customerName: 'Ticket Format Test',
        items: [
          { name: 'Strawberry Base', price: 5.99, quantity: 2, category: 'base' },
          { name: 'Premium Topping', price: 2.00, quantity: 1, category: 'topping', isPremium: true }
        ],
        totalAmount: 13.98,
        menuType: 'Custom Order'
      };
      
      const response = await request(BASE_URL)
        .post('/api/orders')
        .send(testOrder);
      
      const orderNumber = response.body.data.orderNumber;
      const printCall = mockedPrinterService.findPrintCallByOrderNumber(orderNumber);
      
      expect(printCall).toBeDefined();
      
      const ticket = printCall!.formattedTicket;
      
      // Verify required ticket elements
      expect(ticket).toContain('IC PASTA KIOSK');
      expect(ticket).toContain(`Order #: ${orderNumber}`);
      expect(ticket).toContain('Customer: Ticket Format Test');
      expect(ticket).toContain('Strawberry Base');
      expect(ticket).toContain('Premium Topping');
      expect(ticket).toContain('[PREMIUM ITEM]');
      expect(ticket).toContain('TOTAL:');
      expect(ticket).toContain('Thank you');
      
      // Verify ticket format validation passes
      expect(mockedPrinterService.validateTicketFormat(ticket)).toBe(true);
    });

    test('Should handle premium item badges correctly', async () => {
      const testOrder = {
        customerName: 'Premium Badge Test',
        items: [
          { name: 'Regular Base', price: 5.99, quantity: 1, category: 'base' },
          { name: 'Premium Sauce', price: 2.50, quantity: 1, category: 'sauce', isPremium: true },
          { name: 'Super Premium Topping', price: 3.00, quantity: 1, category: 'topping', isPremium: true }
        ],
        totalAmount: 11.49
      };
      
      const response = await request(BASE_URL)
        .post('/api/orders')
        .send(testOrder);
      
      const orderNumber = response.body.data.orderNumber;
      
      // Verify premium badges are included
      expect(mockedPrinterService.validatePremiumBadges(orderNumber)).toBe(true);
      
      const printCall = mockedPrinterService.findPrintCallByOrderNumber(orderNumber);
      const ticket = printCall!.formattedTicket;
      
      // Count premium badges (should be 2)
      const premiumMatches = ticket.match(/\[PREMIUM ITEM\]/g);
      expect(premiumMatches).toBeTruthy();
      expect(premiumMatches!.length).toBe(2);
    });
  });

  describe('Concurrent Order Print Handling', () => {
    test('Should handle rapid-fire orders with individual print calls', async () => {
      const orders = Array.from({ length: 5 }, (_, i) => ({
        customerName: `Rapid Order ${i + 1}`,
        items: [
          { name: 'Quick Base', price: 4.99, quantity: 1, category: 'base' }
        ],
        totalAmount: 4.99
      }));
      
      // Submit all orders simultaneously
      const promises = orders.map(order => 
        request(BASE_URL)
          .post('/api/orders')
          .send(order)
      );
      
      const responses = await Promise.all(promises);
      
      // Verify all orders successful
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });
      
      // Verify exactly 5 print calls (one per order)
      expect(mockedPrinterService.getPrintCount()).toBe(5);
      
      // Verify each order has unique print call
      const printCalls = mockedPrinterService.getPrintCalls();
      const orderNumbers = printCalls.map(call => call.ticketData.orderNumber);
      const uniqueOrderNumbers = new Set(orderNumbers);
      expect(uniqueOrderNumbers.size).toBe(5);
    });
  });

  describe('Print Error Handling', () => {
    test('Should handle printer errors gracefully without failing order', async () => {
      // Configure mock to simulate printer error
      mockedPrinterService.simulateError(true, 'Simulated printer offline error');
      
      const testOrder = {
        customerName: 'Error Test Customer',
        items: [
          { name: 'Error Test Base', price: 5.99, quantity: 1 }
        ],
        totalAmount: 5.99
      };
      
      const response = await request(BASE_URL)
        .post('/api/orders')
        .send(testOrder);
      
      // Order should still succeed even if print fails
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Verify print was attempted but failed
      expect(mockedPrinterService.getPrintCount()).toBe(1);
      
      const printCall = mockedPrinterService.getPrintCalls()[0];
      expect(printCall.success).toBe(false);
      expect(printCall.error).toContain('Simulated printer offline error');
    });

    test('Should retry print functionality via manual reprint', async () => {
      // First create order with printer error
      mockedPrinterService.simulateError(true, 'Initial print failure');
      
      const testOrder = {
        customerName: 'Retry Test Customer',
        items: [{ name: 'Retry Base', price: 5.99, quantity: 1 }],
        totalAmount: 5.99
      };
      
      const orderResponse = await request(BASE_URL)
        .post('/api/orders')
        .send(testOrder);
      
      const orderNumber = orderResponse.body.data.orderNumber;
      
      // Verify initial print failed
      expect(mockedPrinterService.getPrintCalls()[0].success).toBe(false);
      
      // Reset mock to working state
      mockedPrinterService.simulateError(false);
      
      // Attempt manual reprint
      const reprintResponse = await request(BASE_URL)
        .post(`/api/print/reprint/${orderNumber}`)
        .set('Cookie', authCookie);
      
      expect(reprintResponse.status).toBe(200);
      expect(reprintResponse.body.success).toBe(true);
      
      // Verify second print attempt succeeded
      expect(mockedPrinterService.getPrintCount()).toBe(2);
      expect(mockedPrinterService.getPrintCalls()[1].success).toBe(true);
    });
  });

  describe('Manual Print API', () => {
    test('Should support manual print with custom data', async () => {
      const manualPrintData = {
        orderNumber: 'MANUAL-001',
        customerName: 'Manual Print Test',
        menuType: 'Custom Manual Order',
        items: [
          { name: 'Manual Base', price: 6.99, quantity: 1 },
          { name: 'Manual Topping', price: 1.99, quantity: 2 }
        ],
        totalAmount: 10.97,
        tableNumber: 'T-42',
        location: 'Test Location'
      };
      
      const response = await request(BASE_URL)
        .post('/api/print/manual')
        .set('Cookie', authCookie)
        .send(manualPrintData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify manual print was processed
      const printCall = mockedPrinterService.findPrintCallByOrderNumber('MANUAL-001');
      expect(printCall).toBeDefined();
      expect(printCall?.ticketData.tableNumber).toBe('T-42');
      expect(printCall?.ticketData.location).toBe('Test Location');
    });

    test('Should require admin authentication for manual print', async () => {
      const manualPrintData = {
        orderNumber: 'MANUAL-002',
        totalAmount: 5.99,
        items: [{ name: 'Test', price: 5.99, quantity: 1 }]
      };
      
      // Attempt without authentication
      const response = await request(BASE_URL)
        .post('/api/print/manual')
        .send(manualPrintData);
      
      expect(response.status).toBe(401);
      expect(mockedPrinterService.getPrintCount()).toBe(0);
    });
  });

  describe('Print Data Validation', () => {
    test('Should validate required print data fields', async () => {
      const incompleteData = {
        customerName: 'Incomplete Test'
        // Missing items and totalAmount
      };
      
      const response = await request(BASE_URL)
        .post('/api/print/manual')
        .set('Cookie', authCookie)
        .send(incompleteData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(mockedPrinterService.getPrintCount()).toBe(0);
    });

    test('Should handle various item data formats', async () => {
      const orderWithComplexItems = {
        customerName: 'Complex Items Test',
        items: {
          base: { name: 'Complex Base', price: 5.99 },
          sauces: [
            { name: 'Sauce 1', price: 1.50 },
            { name: 'Sauce 2', price: 1.50 }
          ],
          toppings: [
            { name: 'Topping 1', price: 2.00, modifiers: ['Extra', 'On Side'] }
          ]
        },
        totalAmount: 10.99
      };
      
      const response = await request(BASE_URL)
        .post('/api/orders')
        .send(orderWithComplexItems);
      
      expect(response.status).toBe(201);
      
      const orderNumber = response.body.data.orderNumber;
      const printCall = mockedPrinterService.findPrintCallByOrderNumber(orderNumber);
      
      expect(printCall).toBeDefined();
      expect(printCall?.success).toBe(true);
      
      // Verify complex items are handled in ticket
      const ticket = printCall!.formattedTicket;
      expect(mockedPrinterService.validateTicketFormat(ticket)).toBe(true);
    });
  });
});