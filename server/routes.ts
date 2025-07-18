import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMenuItemSchema, insertOrderSchema, insertUserSchema, insertMenuSchema, insertCartSchema } from "@shared/schema";
import { z } from "zod";
import { 
  asyncHandler, 
  validateBody, 
  validatePartialBody, 
  validateIdParam, 
  successResponse, 
  errorResponse,
  globalErrorHandler 
} from "./middleware";
import { upload, deleteUploadedFile, getFileUrl } from "./upload";
import { printerService } from "./printer";
import { qrCodeService } from "./qr-generator";
import { setupSecureAuth, authenticateAdmin, generateToken, verifyPassword, hashPassword, type AuthenticatedRequest } from "./auth";
import path from 'path';
import express from 'express';

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== SECURITY SETUP ====================
  await setupSecureAuth(app);
  
  // ==================== STATIC FILE SERVING ====================
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // ==================== MENU TYPE ROUTES ====================
  
  // GET /api/menus - Get all menus
  app.get("/api/menus", asyncHandler(async (req, res) => {
    const menus = await storage.getMenus();
    res.json(successResponse(menus));
  }));

  // POST /api/menus - Create new menu
  app.post("/api/menus", 
    authenticateAdmin,
    validateBody(insertMenuSchema),
    asyncHandler(async (req, res) => {
      const menu = await storage.createMenu(req.body);
      res.status(201).json(successResponse(menu, "Menu created successfully"));
    })
  );

  // PUT /api/menus/:id - Update menu
  app.put("/api/menus/:id", 
    authenticateAdmin,
    validateIdParam,
    validatePartialBody(insertMenuSchema),
    asyncHandler(async (req, res) => {
      const menu = await storage.updateMenu(parseInt(req.params.id), req.body);
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

  // POST /api/menu - Create new menu item
  app.post("/api/menu", 
    authenticateAdmin,
    upload.single('image'),
    asyncHandler(async (req, res) => {
      let menuItemData = req.body;
      
      // Handle uploaded image
      if (req.file) {
        menuItemData.imageUrl = getFileUrl(req.file.filename);
      }
      
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
      
      const validatedData = insertMenuItemSchema.parse(menuItemData);
      const menuItem = await storage.createMenuItem(validatedData, menuIds);
      res.status(201).json(successResponse(menuItem, "Menu item created successfully"));
    })
  );

  // PUT /api/menu/:id - Update menu item
  app.put("/api/menu/:id", 
    authenticateAdmin,
    validateIdParam,
    upload.single('image'),
    asyncHandler(async (req, res) => {
      let updateData = req.body;
      
      // Handle uploaded image
      if (req.file) {
        // Delete old image if it exists
        const existingItem = await storage.getMenuItemById(parseInt(req.params.id));
        if (existingItem && existingItem.imageUrl && existingItem.imageUrl.startsWith('/uploads/')) {
          const oldFilename = path.basename(existingItem.imageUrl);
          await deleteUploadedFile(oldFilename);
        }
        
        updateData.imageUrl = getFileUrl(req.file.filename);
      }
      
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
      
      const validatedData = insertMenuItemSchema.partial().parse(updateData);
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

  // POST /api/menu-items - Create new menu item
  app.post("/api/menu-items", 
    validateBody(insertMenuItemSchema),
    asyncHandler(async (req, res) => {
      const menuItem = await storage.createMenuItem(req.body, []); // Empty array for backward compatibility
      res.status(201).json(successResponse(menuItem, "Menu item created successfully"));
    })
  );

  // PUT /api/menu-items/:id - Update menu item
  app.put("/api/menu-items/:id", 
    validateIdParam,
    validatePartialBody(insertMenuItemSchema),
    asyncHandler(async (req, res) => {
      const menuItem = await storage.updateMenuItem(parseInt(req.params.id), req.body);
      res.json(successResponse(menuItem, "Menu item updated successfully"));
    })
  );

  // DELETE /api/menu-items/:id - Delete menu item
  app.delete("/api/menu-items/:id", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      // Get menu item to delete associated image file
      const menuItem = await storage.getMenuItemById(parseInt(req.params.id));
      if (menuItem && menuItem.imageUrl && menuItem.imageUrl.startsWith('/uploads/')) {
        const filename = path.basename(menuItem.imageUrl);
        await deleteUploadedFile(filename);
      }
      
      await storage.deleteMenuItem(parseInt(req.params.id));
      res.json(successResponse(null, "Menu item deleted successfully"));
    })
  );

  // ==================== FILE UPLOAD ROUTES ====================

  // POST /api/upload/menu-item-image - Upload menu item image
  app.post("/api/upload/menu-item-image", 
    authenticateAdmin,
    (req, res, next) => {
      upload.single('image')(req, res, (err) => {
        if (err) {
          return res.status(400).json(errorResponse(err.message));
        }
        next();
      });
    },
    asyncHandler(async (req, res) => {
      if (!req.file) {
        return res.status(400).json(errorResponse("No image file provided"));
      }
      
      const imageUrl = getFileUrl(req.file.filename);
      res.json(successResponse({ 
        filename: req.file.filename,
        url: imageUrl,
        size: req.file.size,
        mimetype: req.file.mimetype
      }, "Image uploaded successfully"));
    })
  );

  // DELETE /api/upload/:filename - Delete uploaded image
  app.delete("/api/upload/:filename", 
    authenticateAdmin,
    asyncHandler(async (req, res) => {
      const { filename } = req.params;
      await deleteUploadedFile(filename);
      res.json(successResponse(null, "Image deleted successfully"));
    })
  );

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

  // POST /api/orders - Create new order
  app.post("/api/orders", asyncHandler(async (req, res) => {
    // Validate customer name is provided
    if (!req.body.customerName?.trim()) {
      return res.status(400).json(errorResponse("Customer name is required"));
    }
    
    const orderData = {
      ...req.body,
      orderNumber: storage.generateOrderNumber(),
      status: "pending",
    };
    
    const validatedData = insertOrderSchema.parse(orderData);
    const order = await storage.createOrder(validatedData);
    
    // Attempt to print receipt
    try {
      const printData = {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        menuType: req.body.menuType || "Ice Cream",
        items: order.items || {},
        totalAmount: order.totalAmount,
        timestamp: order.createdAt || new Date().toISOString(),
        cartId: req.body.cartId
      };
      
      const printSuccess = await printerService.printReceipt(printData);
      if (!printSuccess) {
        console.warn(`Print failed for order ${order.orderNumber}`);
      }
    } catch (printError) {
      console.error('Print error:', printError);
      // Don't fail the order if printing fails
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

  // ==================== PRINT SERVICE ROUTES ====================

  // GET /api/print/test - Test printer connection
  app.get("/api/print/test", asyncHandler(async (req, res) => {
    const isConnected = await printerService.testConnection();
    res.json(successResponse(
      { connected: isConnected }, 
      isConnected ? "Printer connected successfully" : "Printer connection failed"
    ));
  }));

  // POST /api/print - Print receipt (for use by other devices)
  app.post("/api/print", asyncHandler(async (req, res) => {
    const { orderNumber, customerName, menuType, items, totalAmount, timestamp, cartId } = req.body;
    
    if (!orderNumber || !totalAmount || !items) {
      return res.status(400).json(errorResponse("Missing required print data"));
    }
    
    const printData = {
      orderNumber,
      customerName,
      menuType: menuType || "Ice Cream",
      items,
      totalAmount,
      timestamp: timestamp || new Date().toISOString(),
      cartId
    };
    
    const printSuccess = await printerService.printReceipt(printData);
    
    if (printSuccess) {
      res.json(successResponse(null, "Receipt printed successfully"));
    } else {
      res.status(500).json(errorResponse("Print failed"));
    }
  }));

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
    
    res.json(successResponse({
      user: { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin 
      },
      token
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
    res.json(successResponse(null, "Logged out successfully"));
  }));

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

  // POST /api/carts - Create new cart
  app.post("/api/carts", 
    validateBody(insertCartSchema),
    asyncHandler(async (req, res) => {
      const cart = await storage.createCart(req.body);
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

  // PUT /api/carts/:cartId - Update cart
  app.put("/api/carts/:cartId", 
    validatePartialBody(insertCartSchema),
    asyncHandler(async (req, res) => {
      const cart = await storage.updateCart(req.params.cartId, req.body);
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