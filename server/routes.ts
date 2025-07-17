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
import path from 'path';
import express from 'express';

export async function registerRoutes(app: Express): Promise<Server> {
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
    validateBody(insertMenuSchema),
    asyncHandler(async (req, res) => {
      const menu = await storage.createMenu(req.body);
      res.status(201).json(successResponse(menu, "Menu created successfully"));
    })
  );

  // PUT /api/menus/:id - Update menu
  app.put("/api/menus/:id", 
    validateIdParam,
    validatePartialBody(insertMenuSchema),
    asyncHandler(async (req, res) => {
      const menu = await storage.updateMenu(parseInt(req.params.id), req.body);
      res.json(successResponse(menu, "Menu updated successfully"));
    })
  );

  // DELETE /api/menus/:id - Delete menu
  app.delete("/api/menus/:id", 
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
    upload.single('image'),
    asyncHandler(async (req, res) => {
      let menuItemData = req.body;
      
      // Handle uploaded image
      if (req.file) {
        menuItemData.imageUrl = getFileUrl(req.file.filename);
      }
      
      // Parse JSON fields if they come as strings (common with multipart/form-data)
      if (typeof menuItemData.menuId === 'string') {
        menuItemData.menuId = parseInt(menuItemData.menuId);
      }
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
      const menuItem = await storage.createMenuItem(validatedData);
      res.status(201).json(successResponse(menuItem, "Menu item created successfully"));
    })
  );

  // PUT /api/menu/:id - Update menu item
  app.put("/api/menu/:id", 
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
      
      // Parse JSON fields if they come as strings (common with multipart/form-data)
      if (typeof updateData.menuId === 'string') {
        updateData.menuId = parseInt(updateData.menuId);
      }
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
      const menuItem = await storage.updateMenuItem(parseInt(req.params.id), validatedData);
      res.json(successResponse(menuItem, "Menu item updated successfully"));
    })
  );

  // DELETE /api/menu/:id - Delete menu item
  app.delete("/api/menu/:id", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      await storage.deleteMenuItem(parseInt(req.params.id));
      res.json(successResponse(null, "Menu item deleted successfully"));
    })
  );

  // PUT /api/menu/:id/sold-out - Toggle sold out status
  app.put("/api/menu/:id/sold-out", 
    validateIdParam,
    asyncHandler(async (req, res) => {
      const { soldOut } = req.body;
      const menuItem = await storage.markItemSoldOut(parseInt(req.params.id), soldOut);
      res.json(successResponse(menuItem, `Item marked as ${soldOut ? 'sold out' : 'available'}`));
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
      const menuItem = await storage.createMenuItem(req.body);
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

  // ==================== AUTHENTICATION ROUTES ====================

  // POST /api/auth/login - Admin login
  app.post("/api/auth/login", asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json(errorResponse("Username and password required"));
    }
    
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }
    
    if (!user.isAdmin) {
      return res.status(403).json(errorResponse("Admin access required"));
    }
    
    res.json(successResponse({
      user: { 
        id: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin 
      }
    }, "Login successful"));
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