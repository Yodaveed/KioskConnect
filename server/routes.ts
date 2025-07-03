import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMenuItemSchema, insertOrderSchema, insertUserSchema, insertMenuSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Menu type endpoints
  app.get("/api/menus", async (req, res) => {
    try {
      const menus = await storage.getMenus();
      res.json(menus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menus" });
    }
  });

  app.post("/api/menus", async (req, res) => {
    try {
      const validatedData = insertMenuSchema.parse(req.body);
      const menu = await storage.createMenu(validatedData);
      res.status(201).json(menu);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid menu data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create menu" });
      }
    }
  });

  app.put("/api/menus/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertMenuSchema.partial().parse(req.body);
      const menu = await storage.updateMenu(parseInt(id), validatedData);
      res.json(menu);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid menu data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update menu" });
      }
    }
  });

  app.delete("/api/menus/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMenu(parseInt(id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete menu" });
    }
  });

  // Menu item endpoints
  app.get("/api/menu", async (req, res) => {
    try {
      const { menuId } = req.query;
      const menuItems = await storage.getMenuItems(menuId ? parseInt(menuId as string) : undefined);
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const { menuId } = req.query;
      const menuItems = await storage.getMenuItemsByCategory(category, menuId ? parseInt(menuId as string) : undefined);
      res.json(menuItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch menu items" });
    }
  });

  app.post("/api/menu", async (req, res) => {
    try {
      const validatedData = insertMenuItemSchema.parse(req.body);
      const menuItem = await storage.createMenuItem(validatedData);
      res.status(201).json(menuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid menu item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create menu item" });
      }
    }
  });

  app.put("/api/menu/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertMenuItemSchema.partial().parse(req.body);
      const menuItem = await storage.updateMenuItem(parseInt(id), validatedData);
      res.json(menuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid menu item data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to update menu item" });
      }
    }
  });

  app.delete("/api/menu/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMenuItem(parseInt(id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete menu item" });
    }
  });

  // Order endpoints
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = {
        ...req.body,
        orderNumber: storage.generateOrderNumber(),
        status: "pending",
      };
      const validatedData = insertOrderSchema.parse(orderData);
      const order = await storage.createOrder(validatedData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getOrderById(parseInt(id));
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const order = await storage.updateOrderStatus(parseInt(id), status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Analytics endpoints
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getOrderStats(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (!user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      res.json({ success: true, user: { id: user.id, username: user.username, isAdmin: user.isAdmin } });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  // QR Code generation endpoint
  app.post("/api/qr/generate", async (req, res) => {
    try {
      const { tableNumber, size = "medium" } = req.body;
      const baseUrl = req.get('host') || 'localhost:5000';
      const qrUrl = `http://${baseUrl}/?table=${tableNumber}`;
      
      res.json({
        url: qrUrl,
        tableNumber,
        size,
        qrCodeData: qrUrl
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate QR code" });
    }
  });

  // Initialize with some sample data
  await initializeSampleData();

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSampleData() {
  try {
    // Create admin user
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      await storage.createUser({
        username: "admin",
        password: "admin123",
        isAdmin: true,
      });
    }

    // Create default menus if they don't exist
    const existingMenus = await storage.getMenus();
    let spaghettiMenu, burgerMenu, soupMenu, pintsMenu;
    
    if (existingMenus.length === 0) {
      spaghettiMenu = await storage.createMenu({
        name: "Spaghetti",
        description: "Our signature spaghetti ice cream menu",
        isActive: true,
        sortOrder: 1,
      });
      
      burgerMenu = await storage.createMenu({
        name: "Burger",
        description: "Burger-style ice cream creations",
        isActive: true,
        sortOrder: 2,
      });
      
      soupMenu = await storage.createMenu({
        name: "Soup",
        description: "Soup-style ice cream presentations",
        isActive: true,
        sortOrder: 3,
      });
      
      pintsMenu = await storage.createMenu({
        name: "Pints",
        description: "Take-home pint containers",
        isActive: true,
        sortOrder: 4,
      });
    } else {
      spaghettiMenu = existingMenus.find(m => m.name === "Spaghetti") || existingMenus[0];
      burgerMenu = existingMenus.find(m => m.name === "Burger") || existingMenus[0];
      soupMenu = existingMenus.find(m => m.name === "Soup") || existingMenus[0];
      pintsMenu = existingMenus.find(m => m.name === "Pints") || existingMenus[0];
    }

    // Create sample menu items for Spaghetti menu
    const existingItems = await storage.getMenuItems();
    if (existingItems.length === 0) {
      const sampleItems = [
        // Bases for Spaghetti menu
        {
          menuId: spaghettiMenu.id,
          name: "Vanilla",
          description: "Classic creamy vanilla ice cream made with real vanilla beans",
          category: "base",
          price: "6.00",
          imageUrl: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800&h=600&fit=crop",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Chocolate",
          description: "Rich and decadent chocolate ice cream with deep cocoa flavor",
          category: "base",
          price: "6.00",
          imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=600&fit=crop",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Strawberry",
          description: "Fresh strawberry ice cream with real fruit pieces",
          category: "base",
          price: "6.50",
          imageUrl: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800&h=600&fit=crop",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Pistachio",
          description: "Premium pistachio ice cream with roasted nuts",
          category: "base",
          price: "7.00",
          imageUrl: "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=800&h=600&fit=crop",
          isActive: true,
          isPremium: true,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Cookies & Cream",
          description: "Vanilla ice cream loaded with chocolate cookie pieces",
          category: "base",
          price: "6.50",
          imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&h=600&fit=crop",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Mint Chocolate Chip",
          description: "Refreshing mint ice cream with dark chocolate chips",
          category: "base",
          price: "6.50",
          imageUrl: "https://images.unsplash.com/photo-1567206563064-6f60f40a2b57?w=800&h=600&fit=crop",
          isActive: true,
          isPremium: false,
        },
        // Sauces for Spaghetti menu
        {
          menuId: spaghettiMenu.id,
          name: "White Chocolate",
          description: "Creamy white chocolate drizzle",
          category: "sauce",
          price: "1.50",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Strawberry Puree",
          description: "Fresh strawberry sauce",
          category: "sauce",
          price: "1.00",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Salted Caramel",
          description: "Sweet and salty caramel",
          category: "sauce",
          price: "1.50",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Hot Fudge",
          description: "Rich chocolate fudge sauce",
          category: "sauce",
          price: "1.50",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        // Toppings for Spaghetti menu
        {
          menuId: spaghettiMenu.id,
          name: "Shredded Coconut",
          description: "Fresh coconut flakes",
          category: "topping",
          price: "0.00",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "M&Ms",
          description: "Colorful chocolate candies",
          category: "topping",
          price: "0.00",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Swedish Fish",
          description: "Chewy fish-shaped candy",
          category: "topping",
          price: "0.00",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Almonds",
          description: "Roasted almond pieces",
          category: "topping",
          price: "0.00",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Rainbow Sprinkles",
          description: "Colorful sugar sprinkles",
          category: "topping",
          price: "0.00",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Chocolate Chips",
          description: "Mini chocolate chips",
          category: "topping",
          price: "0.00",
          imageUrl: "",
          isActive: true,
          isPremium: false,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Ferrero Rocher",
          description: "Premium chocolate hazelnut candy",
          category: "topping",
          price: "1.00",
          imageUrl: "",
          isActive: true,
          isPremium: true,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Fresh Berries",
          description: "Seasonal fresh berries",
          category: "topping",
          price: "1.50",
          imageUrl: "",
          isActive: true,
          isPremium: true,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Macarons",
          description: "French macarons",
          category: "topping",
          price: "2.00",
          imageUrl: "",
          isActive: true,
          isPremium: true,
        },
        {
          menuId: spaghettiMenu.id,
          name: "Gold Flakes",
          description: "Edible gold flakes",
          category: "topping",
          price: "3.00",
          imageUrl: "",
          isActive: true,
          isPremium: true,
        },
      ];

      for (const item of sampleItems) {
        await storage.createMenuItem(item);
      }
    }
  } catch (error) {
    console.error("Error initializing sample data:", error);
  }
}
