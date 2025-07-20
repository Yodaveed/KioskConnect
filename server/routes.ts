import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  enhancedInsertMenuItemSchema, 
  enhancedInsertOrderSchema, 
  enhancedInsertMenuSchema, 
  enhancedInsertCartSchema,
  loginSchema,
  idParamSchema,
  menuQuerySchema,
  categoryQuerySchema,
  enhancedInsertInventoryItemSchema,
  enhancedInventoryAdjustmentSchema,
  manualTicketSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  asyncHandler, 
  validateBody, 
  validatePartialBody, 
  validateIdParam, 
  successResponse, 
  errorResponse,
  globalErrorHandler,
  generalApiLimit,
  orderRateLimit
} from "./middleware";
// Removed file upload functionality - now using external URLs
import { printerService } from "./printer";
import { qrCodeService } from "./qr-generator";
import { setupSecureAuth, authenticateAdmin, generateToken, verifyPassword, hashPassword, type AuthenticatedRequest } from "./auth";
// Removed path import - no longer needed without file uploads
import express from 'express';

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== SECURITY SETUP ====================
  await setupSecureAuth(app);
  
  // Apply general rate limiting to all API routes for security
  app.use('/api', generalApiLimit);
  
  // ==================== STATIC FILE SERVING ====================
  
  // Removed static file serving for uploads - now using external URLs

  // ==================== MENU TYPE ROUTES ====================
  
  // GET /api/menus - Get all menus
  app.get("/api/menus", asyncHandler(async (req, res) => {
    const menus = await storage.getMenus();
    res.json(successResponse(menus));
  }));

  // POST /api/menus - Create new menu with enhanced validation
  app.post("/api/menus", 
    authenticateAdmin,
    validateBody(enhancedInsertMenuSchema),
    asyncHandler(async (req, res) => {
      const menuData = req.body;
      
      const menu = await storage.createMenu(menuData);
      res.status(201).json(successResponse(menu, "Menu created successfully"));
    })
  );

  // PUT /api/menus/:id - Update menu
  app.put("/api/menus/:id", 
    authenticateAdmin,
    validateIdParam,
    validatePartialBody(enhancedInsertMenuSchema),
    asyncHandler(async (req, res) => {
      const menuData = req.body;
      const menu = await storage.updateMenu(parseInt(req.params.id), menuData);
      res.json(successResponse(menu, "Menu updated successfully"));
    })
  );

  // DELETE /api/menus/:id - Delete menu
  app.delete("/api/menus/:id", 
    authenticateAdmin,
    validateIdParam,
    asyncHandler(async (req, res) => {
      await storage.deleteMenu(parseInt(req.params.id));
      res.json(successResponse(null, "Menu deleted successfully"));
    })
  );

  // ==================== MENU ITEM ROUTES ====================

  // GET /api/menu - Get all menu items (with optional menuId filter)
  app.get("/api/menu", asyncHandler(async (req, res) => {
    const { menuId } = req.query;
    const menuItems = await storage.getMenuItems(menuId ? parseInt(menuId as string) : undefined);
    res.json(successResponse(menuItems));
  }));

  // GET /api/menu/:category - Get menu items by category
  app.get("/api/menu/:category", asyncHandler(async (req, res) => {
    const { category } = req.params;
    const { menuId } = req.query;
    const menuItems = await storage.getMenuItemsByCategory(
      category, 
      menuId ? parseInt(menuId as string) : undefined
    );
    res.json(successResponse(menuItems));
  }));

  // POST /api/menu - Create new menu item with enhanced validation
  app.post("/api/menu", 
    authenticateAdmin,
    validateBody(enhancedInsertMenuItemSchema),
    asyncHandler(async (req, res) => {
      let menuItemData = req.body;
      
      // Extract menu IDs (for multi-menu assignment)
      let menuIds = [];
      if (menuItemData.menuId) {
        if (typeof menuItemData.menuId === 'string') {
          menuIds = [parseInt(menuItemData.menuId)];
        } else if (Array.isArray(menuItemData.menuId)) {
          menuIds = menuItemData.menuId.map(id => parseInt(id));
        }
      }
      if (menuItemData.menuIds) {
        if (typeof menuItemData.menuIds === 'string') {
          menuIds = JSON.parse(menuItemData.menuIds);
        } else if (Array.isArray(menuItemData.menuIds)) {
          menuIds = menuItemData.menuIds;
        }
      }
      
      // Remove menuId and menuIds from the data as they're not part of the schema anymore
      delete menuItemData.menuId;
      delete menuItemData.menuIds;
      
      // Parse JSON fields if they come as strings (common with multipart/form-data)
      if (typeof menuItemData.isActive === 'string') {
        menuItemData.isActive = menuItemData.isActive === 'true';
      }
      if (typeof menuItemData.isPremium === 'string') {
        menuItemData.isPremium = menuItemData.isPremium === 'true';
      }
      if (typeof menuItemData.maxQuantity === 'string') {
        menuItemData.maxQuantity = menuItemData.maxQuantity ? parseInt(menuItemData.maxQuantity) : null;
      }
      if (typeof menuItemData.sortOrder === 'string') {
        menuItemData.sortOrder = menuItemData.sortOrder ? parseInt(menuItemData.sortOrder) : 0;
      }
      if (typeof menuItemData.isRequired === 'string') {
        menuItemData.isRequired = menuItemData.isRequired === 'true';
      }
      
      // Use enhanced validation schema with comprehensive security checks
      const validatedData = enhancedInsertMenuItemSchema.parse(menuItemData);
      const menuItem = await storage.createMenuItem(validatedData, menuIds);
      
      // Audit log for security compliance
      console.log(`Menu item created: ${menuItem.name} (ID: ${menuItem.id}) by admin at ${new Date().toISOString()}`);
      
      res.status(201).json(successResponse(menuItem, "Menu item created successfully"));
    })
  );

  // PUT /api/menu/:id - Update menu item
  app.put("/api/menu/:id", 
    authenticateAdmin,
    validateIdParam,
    validatePartialBody(enhancedInsertMenuItemSchema),
    asyncHandler(async (req, res) => {
      let updateData = req.body;
      
      // Extract menu IDs for assignment
      let menuIds = [];
      if (updateData.menuIds) {
        if (typeof updateData.menuIds === 'string') {
          menuIds = JSON.parse(updateData.menuIds);
        } else if (Array.isArray(updateData.menuIds)) {
          menuIds = updateData.menuIds;
        }
      }
      
      // Remove menuId and menuIds from the data as they're not part of the schema anymore
      delete updateData.menuId;
      delete updateData.menuIds;
      
      // Parse JSON fields if they come as strings (common with multipart/form-data)
      if (typeof updateData.isActive === 'string') {
        updateData.isActive = updateData.isActive === 'true';
      }
      if (typeof updateData.isPremium === 'string') {
        updateData.isPremium = updateData.isPremium === 'true';
      }
      if (typeof updateData.maxQuantity === 'string') {
        updateData.maxQuantity = updateData.maxQuantity ? parseInt(updateData.maxQuantity) : null;
      }
      if (typeof updateData.sortOrder === 'string') {
        updateData.sortOrder = updateData.sortOrder ? parseInt(updateData.sortOrder) : 0;
      }
      if (typeof updateData.isRequired === 'string') {
        updateData.isRequired = updateData.isRequired === 'true';
      }
      
      const validatedData = enhancedInsertMenuItemSchema.partial().parse(updateData);
      const menuItem = await storage.updateMenuItem(parseInt(req.params.id), validatedData, menuIds.length > 0 ? menuIds : undefined);
      res.json(successResponse(menuItem, "Menu item updated successfully"));
    })
  );

  // DELETE /api/menu/:id - Delete menu item
  app.delete("/api/menu/:id", 
    authenticateAdmin,
    validateIdParam,
    asyncHandler(async (req, res) => {
      await storage.deleteMenuItem(parseInt(req.params.id));
      res.json(successResponse(null, "Menu item deleted successfully"));
    })
  );

  // PUT /api/menu/:id/sold-out - Toggle sold out status
  app.put("/api/menu/:id/sold-out", 
    authenticateAdmin,
    validateIdParam,
    asyncHandler(async (req, res) => {
      const { soldOut } = req.body;
      const menuItem = await storage.markItemSoldOut(parseInt(req.params.id), soldOut);
      res.json(successResponse(menuItem, `Item marked as ${soldOut ? 'sold out' : 'available'}`));
    })
  );

  // ==================== MENU ITEM ASSIGNMENTS ====================

  // GET /api/menu-items/:id/menus - Get menus for a menu item
  app.get("/api/menu-items/:id/menus", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      const menus = await storage.getMenuItemMenus(parseInt(req.params.id));
      res.json(successResponse(menus));
    })
  );

  // POST /api/menu-items/:id/menus - Assign menu item to multiple menus
  app.post("/api/menu-items/:id/menus", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      const { menuIds } = req.body;
      if (!Array.isArray(menuIds)) {
        return res.status(400).json(errorResponse("menuIds must be an array"));
      }
      
      await storage.assignMenuItemToMenus(parseInt(req.params.id), menuIds);
      res.json(successResponse(null, "Menu item assigned to menus successfully"));
    })
  );

  // DELETE /api/menu-items/:id/menus - Remove menu item from multiple menus
  app.delete("/api/menu-items/:id/menus", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      const { menuIds } = req.body;
      if (!Array.isArray(menuIds)) {
        return res.status(400).json(errorResponse("menuIds must be an array"));
      }
      
      await storage.removeMenuItemFromMenus(parseInt(req.params.id), menuIds);
      res.json(successResponse(null, "Menu item removed from menus successfully"));
    })
  );

  // GET /api/menu-items-with-menus - Get all menu items with their assigned menus
  app.get("/api/menu-items-with-menus", 
    asyncHandler(async (req, res) => {
      const menuItemsWithMenus = await storage.getMenuItemsWithMenus();
      res.json(successResponse(menuItemsWithMenus));
    })
  );

  // ==================== MENU ITEMS ROUTES (ALIAS) ====================
  
  // GET /api/menu-items - Get all menu items
  app.get("/api/menu-items", asyncHandler(async (req, res) => {
    const { menuId } = req.query;
    const menuItems = await storage.getMenuItems(menuId ? parseInt(menuId as string) : undefined);
    res.json(successResponse(menuItems));
  }));

  // POST /api/menu-items - Create new menu item with enhanced validation
  app.post("/api/menu-items", 
    validateBody(enhancedInsertMenuItemSchema),
    asyncHandler(async (req, res) => {
      const menuItem = await storage.createMenuItem(req.body, []); // Empty array for backward compatibility
      
      // Audit log for security compliance
      console.log(`Menu item created via API: ${menuItem.name} (ID: ${menuItem.id}) at ${new Date().toISOString()}`);
      
      res.status(201).json(successResponse(menuItem, "Menu item created successfully"));
    })
  );

  // PUT /api/menu-items/:id - Update menu item with enhanced validation
  app.put("/api/menu-items/:id", 
    validateIdParam,
    validatePartialBody(enhancedInsertMenuItemSchema),
    asyncHandler(async (req, res) => {
      const menuItem = await storage.updateMenuItem(parseInt(req.params.id), req.body);
      
      // Audit log for security compliance
      console.log(`Menu item updated via API: ${menuItem.name} (ID: ${menuItem.id}) at ${new Date().toISOString()}`);
      
      res.json(successResponse(menuItem, "Menu item updated successfully"));
    })
  );

  // DELETE /api/menu-items/:id - Delete menu item
  app.delete("/api/menu-items/:id", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      await storage.deleteMenuItem(parseInt(req.params.id));
      res.json(successResponse(null, "Menu item deleted successfully"));
    })
  );

  // ==================== FILE UPLOAD ROUTES (REMOVED) ====================
  // File upload functionality removed - now using external image URLs

  // ==================== ORDER ROUTES ====================

  // GET /api/orders - Get all orders
  app.get("/api/orders", asyncHandler(async (req, res) => {
    const orders = await storage.getOrders();
    res.json(successResponse(orders));
  }));

  // GET /api/orders/:id - Get specific order
  app.get("/api/orders/:id", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      const order = await storage.getOrderById(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json(errorResponse("Order not found"));
      }
      res.json(successResponse(order));
    })
  );

  // POST /api/orders - Create new order with enhanced validation and rate limiting
  app.post("/api/orders", 
    orderRateLimit, // Prevent rapid order spam
    asyncHandler(async (req, res) => {
    // Validate customer name is provided
    if (!req.body.customerName?.trim()) {
      return res.status(400).json(errorResponse("Customer name is required"));
    }
    
    const orderData = {
      ...req.body,
      orderNumber: storage.generateOrderNumber(),
      status: "pending",
    };
    
    const validatedData = enhancedInsertOrderSchema.parse(orderData);
    const order = await storage.createOrder(validatedData);
    
    // Audit log for security compliance
    console.log(`Order created: ${order.orderNumber} for ${order.customerName} - Total: $${order.totalAmount} at ${new Date().toISOString()}`);
    
    // SECURE AUTO-PRINT: Automatically print receipt on order placement
    try {
      // Extract QR info from request body if available
      const qrTable = req.body.qrTable;
      const qrLocation = req.body.qrLocation;
      
      const printData = {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        menuType: req.body.menuType || "Ice Cream",
        items: order.items || {},
        totalAmount: order.totalAmount,
        timestamp: order.createdAt || new Date().toISOString(),
        cartId: req.body.cartId,
        tableNumber: qrTable,
        location: qrLocation
      };
      
      const printSuccess = await printerService.printReceipt(printData);
      if (!printSuccess) {
        console.warn(`Auto-print failed for order ${order.orderNumber} - receipt can be reprinted by admin`);
      } else {
        console.log(`Receipt auto-printed for order ${order.orderNumber}`);
      }
    } catch (printError) {
      console.error('Auto-print error:', printError);
      // Don't fail the order if printing fails - admin can reprint later
    }
    
    res.status(201).json(successResponse(order, "Order placed successfully"));
  }));

  // PUT /api/orders/:id/status - Update order status
  app.put("/api/orders/:id/status", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      const { status } = req.body;
      
      if (!status || !["pending", "preparing", "completed", "cancelled"].includes(status)) {
        return res.status(400).json(errorResponse("Invalid status"));
      }
      
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      res.json(successResponse(order, "Order status updated successfully"));
    })
  );

  // ==================== AUTHENTICATION ROUTES ====================
  // Note: Authentication routes are handled in setupSecureAuth() in auth.ts

  // ==================== ANALYTICS ROUTES ====================

  // GET /api/analytics/stats - Get order statistics
  app.get("/api/analytics/stats", asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const stats = await storage.getOrderStats(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    res.json(successResponse(stats));
  }));

  // ==================== SECURE PRINT SERVICE ROUTES ====================
  // SECURITY: All printing routes require admin authentication

  // GET /api/print/test - Test printer connection (ADMIN ONLY)
  app.get("/api/print/test", 
    authenticateAdmin,
    asyncHandler(async (req, res) => {
      const isConnected = await printerService.testConnection();
      res.json(successResponse(
        { connected: isConnected }, 
        isConnected ? "Thermal printer connected successfully" : "Thermal printer connection failed"
      ));
    })
  );

  // POST /api/print/reprint/:orderId - Reprint receipt for existing order (ADMIN ONLY)
  app.post("/api/print/reprint/:orderId", 
    authenticateAdmin,
    validateIdParam,
    asyncHandler(async (req, res) => {
      const order = await storage.getOrderById(parseInt(req.params.orderId));
      if (!order) {
        return res.status(404).json(errorResponse("Order not found"));
      }

      const printData = {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        menuType: req.body.menuType || "Ice Cream",
        items: order.items || {},
        totalAmount: order.totalAmount,
        timestamp: order.createdAt || new Date().toISOString(),
        cartId: order.cartId,
        tableNumber: order.tableNumber,
        location: order.location
      };

      const printSuccess = await printerService.reprintOrder(printData);
      
      if (printSuccess) {
        res.json(successResponse(null, `Receipt reprinted successfully for order #${order.orderNumber}`));
      } else {
        res.status(500).json(errorResponse("Reprint failed"));
      }
    })
  );

  // POST /api/print/manual - Manual print with custom data (ADMIN ONLY)
  app.post("/api/print/manual", 
    authenticateAdmin,
    asyncHandler(async (req, res) => {
      const { orderNumber, customerName, menuType, items, totalAmount, timestamp, cartId, tableNumber, location } = req.body;
      
      if (!orderNumber || !totalAmount || !items) {
        return res.status(400).json(errorResponse("Missing required print data"));
      }
      
      const printData = {
        orderNumber,
        customerName,
        menuType: menuType || "IC Pasta",
        items,
        totalAmount,
        timestamp: timestamp || new Date().toISOString(),
        cartId,
        tableNumber,
        location
      };
      
      const printSuccess = await printerService.printReceipt(printData);
      
      if (printSuccess) {
        res.json(successResponse(null, "Receipt printed successfully"));
      } else {
        res.status(500).json(errorResponse("Print failed"));
      }
    })
  );

  // ==================== QR CODE ROUTES ====================

  // GET /api/qr/:tableNumber - Generate QR code for table
  app.get("/api/qr/:tableNumber", asyncHandler(async (req, res) => {
    const { tableNumber } = req.params;
    const { location, format } = req.query;
    
    const options = {
      tableNumber,
      location: location as string,
    };
    
    try {
      if (format === 'svg') {
        const qrCodeSVG = await qrCodeService.generateQRCodeSVG(options);
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(qrCodeSVG);
      } else {
        const qrCodeDataURL = await qrCodeService.generateQRCode(options);
        res.json(successResponse({
          qrCode: qrCodeDataURL,
          url: qrCodeService.generateOrderURL(options)
        }));
      }
    } catch (error) {
      res.status(500).json(errorResponse("Failed to generate QR code"));
    }
  }));

  // GET /api/qr/bulk/:count - Generate multiple QR codes for tables
  app.get("/api/qr/bulk/:count", asyncHandler(async (req, res) => {
    const count = parseInt(req.params.count);
    const { location, startNumber = 1 } = req.query;
    
    if (count > 50) {
      return res.status(400).json(errorResponse("Maximum 50 QR codes at once"));
    }
    
    const qrCodes = [];
    for (let i = 0; i < count; i++) {
      const tableNumber = (parseInt(startNumber as string) + i).toString();
      const options = {
        tableNumber,
        location: location as string,
      };
      
      try {
        const qrCodeDataURL = await qrCodeService.generateQRCode(options);
        qrCodes.push({
          tableNumber,
          qrCode: qrCodeDataURL,
          url: qrCodeService.generateOrderURL(options)
        });
      } catch (error) {
        console.error(`Failed to generate QR code for table ${tableNumber}:`, error);
      }
    }
    
    res.json(successResponse(qrCodes));
  }));

  // ==================== AUTHENTICATION ROUTES ====================

  // POST /api/auth/login - Admin login with secure authentication
  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json(errorResponse("Username and password required"));
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }
    
    if (!user.isAdmin) {
      return res.status(403).json(errorResponse("Admin access required"));
    }
    
    const token = generateToken({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    });
    
    // Set secure HTTP-only cookie for authentication
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json(successResponse({ 
      user: { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin 
      }, 
      token: "stored_in_cookie" 
    }, "Login successful"));
  }));

  // GET /api/auth/verify - Verify admin token
  app.get("/api/auth/verify", authenticateAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.json(successResponse({
      user: req.user
    }, "Token valid"));
  }));

  // POST /api/auth/logout - Admin logout
  app.post("/api/auth/logout", asyncHandler(async (req, res) => {
    res.clearCookie('auth_token');
    res.json(successResponse(null, "Logged out successfully"));
  }));

  // ==================== INVENTORY MANAGEMENT ROUTES ====================
  // SECURITY: All inventory routes require admin authentication

  // GET /api/inventory - Get all inventory with low-stock alerts
  app.get("/api/inventory", 
    authenticateAdmin,
    asyncHandler(async (req, res) => {
      const inventory = await storage.getInventory();
      const lowStock = await storage.getInventoryLowStock();
      res.json(successResponse({ inventory, lowStock }));
    })
  );

  // POST /api/inventory - Create new inventory item
  app.post("/api/inventory", 
    authenticateAdmin,
    validateBody(enhancedInsertInventoryItemSchema),
    asyncHandler(async (req, res) => {
      const item = await storage.createInventoryItem(req.body);
      
      // Audit log for inventory creation
      console.log(`Inventory item created: ${item.name} (${item.quantity} ${item.unit}) by admin at ${new Date().toISOString()}`);
      
      res.json(successResponse(item, "Inventory item created"));
    })
  );

  // PUT /api/inventory/:id - Update inventory item
  app.put("/api/inventory/:id", 
    authenticateAdmin,
    validateIdParam,
    validatePartialBody(enhancedInsertInventoryItemSchema),
    asyncHandler(async (req, res) => {
      const updated = await storage.updateInventoryItem(parseInt(req.params.id), req.body);
      
      // Audit log for inventory updates
      console.log(`Inventory item updated: ID ${req.params.id} by admin at ${new Date().toISOString()}`);
      
      res.json(successResponse(updated, "Inventory item updated"));
    })
  );

  // DELETE /api/inventory/:id - Archive inventory item (soft delete)
  app.delete("/api/inventory/:id", 
    authenticateAdmin,
    validateIdParam,
    asyncHandler(async (req, res) => {
      await storage.archiveInventoryItem(parseInt(req.params.id));
      
      // Audit log for inventory archival
      console.log(`Inventory item archived: ID ${req.params.id} by admin at ${new Date().toISOString()}`);
      
      res.json(successResponse(null, "Inventory item archived"));
    })
  );

  // POST /api/inventory-adjustments - Batch inventory adjustments for tally
  app.post("/api/inventory-adjustments", 
    authenticateAdmin,
    asyncHandler(async (req, res) => {
      const { adjustments } = req.body;
      
      if (!adjustments || !Array.isArray(adjustments)) {
        return res.status(400).json(errorResponse("Adjustments array required"));
      }

      const results = [];
      for (const adjustment of adjustments) {
        try {
          const result = await storage.createInventoryAdjustment({
            inventoryItemId: adjustment.inventoryItemId,
            adjustment: adjustment.adjustment,
            reason: adjustment.reason,
            note: adjustment.note,
            userId: req.user!.id
          });
          results.push(result);
        } catch (error) {
          console.error(`Failed to create adjustment for item ${adjustment.inventoryItemId}:`, error);
        }
      }
      
      // Audit log for batch adjustments
      console.log(`Batch inventory adjustments (${adjustments.length} items) by admin ${req.user!.id} at ${new Date().toISOString()}`);
      
      res.json(successResponse(results, "Inventory adjustments applied"));
    })
  );

  // POST /api/inventory/:id/adjust - Adjust inventory quantity (add/remove for delivery, waste, etc.)
  app.post("/api/inventory/:id/adjust", 
    authenticateAdmin,
    validateIdParam,
    validateBody(enhancedInventoryAdjustmentSchema.omit({ inventoryItemId: true, userId: true })),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(errorResponse("User not authenticated"));
      }
      
      const updated = await storage.adjustInventoryItem({
        inventoryItemId: parseInt(req.params.id),
        adjustment: req.body.adjustment,
        reason: req.body.reason,
        note: req.body.note || "",
        userId
      });
      
      // Audit log for inventory adjustments
      console.log(`Inventory adjusted: ID ${req.params.id}, change: ${req.body.adjustment}, reason: ${req.body.reason} by user ${userId} at ${new Date().toISOString()}`);
      
      res.json(successResponse(updated, "Inventory adjusted"));
    })
  );

  // GET /api/inventory-log - Get all inventory adjustments
  app.get("/api/inventory-log", 
    authenticateAdmin,
    asyncHandler(async (req, res) => {
      const log = await storage.getInventoryAdjustments();
      res.json(successResponse(log));
    })
  );

  // GET /api/inventory-log/:itemId - Get adjustments for specific item
  app.get("/api/inventory-log/:itemId", 
    authenticateAdmin,
    validateIdParam,
    asyncHandler(async (req, res) => {
      const log = await storage.getInventoryAdjustmentsByItem(parseInt(req.params.itemId));
      res.json(successResponse(log));
    })
  );

  // POST /api/manual-ticket - Create manual ticket entry and update inventory
  app.post("/api/manual-ticket", 
    authenticateAdmin,
    validateBody(manualTicketSchema),
    asyncHandler(async (req: AuthenticatedRequest, res) => {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(errorResponse("User not authenticated"));
      }
      
      // 1. Create an order flagged as manual
      const orderData = {
        orderNumber: storage.generateOrderNumber(),
        customerName: req.body.customerName || "Manual Entry",
        status: "completed" as const,
        totalAmount: req.body.totalAmount.toString(),
        items: req.body.items,
        manualEntry: true,
      };
      
      const validatedOrderData = enhancedInsertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedOrderData);
      
      // 2. Deduct inventory/log for each item
      for (const item of req.body.items) {
        await storage.adjustInventoryItem({
          inventoryItemId: item.inventoryItemId,
          adjustment: -item.quantity,
          reason: "manual ticket",
          note: req.body.note || `Manual ticket #${order.orderNumber}`,
          userId
        });
      }
      
      // Audit log for manual ticket entries
      console.log(`Manual ticket created: ${order.orderNumber}, total: $${order.totalAmount}, items: ${req.body.items.length} by user ${userId} at ${new Date().toISOString()}`);
      
      res.json(successResponse(order, "Manual ticket entered, inventory updated"));
    })
  );

  // ==================== QR CODE ROUTES ====================

  // POST /api/qr/generate - Generate QR code for table
  app.post("/api/qr/generate", asyncHandler(async (req, res) => {
    const { tableNumber, size = "medium" } = req.body;
    
    if (!tableNumber) {
      return res.status(400).json(errorResponse("Table number is required"));
    }
    
    const baseUrl = req.get('host') || 'localhost:5000';
    const qrUrl = `http://${baseUrl}/?table=${tableNumber}`;
    
    res.json(successResponse({
      url: qrUrl,
      tableNumber,
      size,
      qrCodeData: qrUrl
    }, "QR code generated successfully"));
  }));

  // ==================== CART ROUTES ====================

  // POST /api/carts - Create new cart with enhanced validation
  app.post("/api/carts", 
    orderRateLimit, // Use order rate limiting for cart operations
    validateBody(enhancedInsertCartSchema),
    asyncHandler(async (req, res) => {
      const cart = await storage.createCart(req.body);
      
      // Audit log for cart creation
      console.log(`Cart created: ${cart.cartId} for ${cart.customerName} - Items: ${JSON.stringify(cart.items)} at ${new Date().toISOString()}`);
      
      res.status(201).json(successResponse(cart, "Cart created successfully"));
    })
  );

  // GET /api/carts/:cartId - Get cart by ID
  app.get("/api/carts/:cartId", asyncHandler(async (req, res) => {
    const cart = await storage.getCart(req.params.cartId);
    if (!cart) {
      return res.status(404).json(errorResponse("Cart not found"));
    }
    res.json(successResponse(cart));
  }));

  // PUT /api/carts/:cartId - Update cart with enhanced validation
  app.put("/api/carts/:cartId", 
    orderRateLimit, // Rate limit cart updates
    validatePartialBody(enhancedInsertCartSchema),
    asyncHandler(async (req, res) => {
      const cart = await storage.updateCart(req.params.cartId, req.body);
      
      // Audit log for cart updates
      console.log(`Cart updated: ${cart.cartId} for ${cart.customerName} - Items: ${JSON.stringify(cart.items)} at ${new Date().toISOString()}`);
      
      res.json(successResponse(cart, "Cart updated successfully"));
    })
  );

  // DELETE /api/carts/:cartId - Delete cart
  app.delete("/api/carts/:cartId", asyncHandler(async (req, res) => {
    await storage.deleteCart(req.params.cartId);
    res.json(successResponse(null, "Cart deleted successfully"));
  }));

  // POST /api/carts/submit - Submit entire cart as orders
  app.post("/api/carts/submit", asyncHandler(async (req, res) => {
    const { items, totalAmount } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json(errorResponse("Cart items are required"));
    }
    
    // Create individual orders for each item in the cart
    const orderNumber = storage.generateOrderNumber();
    const orderPromises = items.map(async (item: any) => {
      const orderData = {
        customerName: item.customerName,
        totalAmount: item.totalPrice.toString(),
        items: item.orderData,
        orderNumber: orderNumber,
        status: "pending"
      };
      
      return await storage.createOrder(orderData);
    });
    
    const orders = await Promise.all(orderPromises);
    
    res.json(successResponse({
      orderNumber,
      ordersCreated: orders.length,
      totalAmount
    }, "Cart submitted successfully"));
  }));

  // ==================== SAMPLE DATA INITIALIZATION ====================
  
  await initializeSampleData();

  // ==================== ERROR HANDLING ====================
  
  // Global error handler
  app.use(globalErrorHandler);

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize sample data if needed
async function initializeSampleData() {
  try {
    // Check if admin user exists
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      await storage.createUser({
        username: "admin",
        password: "admin123",
        isAdmin: true
      });
      console.log("✓ Admin user created (username: admin, password: admin123)");
    }

    // Check if menus exist
    const existingMenus = await storage.getMenus();
    if (existingMenus.length === 0) {
      console.log("✓ Sample data already exists, skipping initialization");
    }
  } catch (error) {
    console.log("✓ Sample data already exists or failed to initialize:", error);
  }
}