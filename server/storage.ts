import { users, menus, menuItems, menuItemsToMenus, orders, orderItems, carts, inventoryItems, inventoryAdjustments, type User, type InsertUser, type Menu, type InsertMenu, type MenuItem, type InsertMenuItem, type MenuItemToMenu, type InsertMenuItemToMenu, type Order, type InsertOrder, type OrderItem, type InsertOrderItem, type Cart, type InsertCart, type InventoryItem, type InsertInventoryItem, type InventoryAdjustment, type InsertInventoryAdjustment } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Menu type methods
  getMenus(): Promise<Menu[]>;
  getMenuById(id: number): Promise<Menu | undefined>;
  createMenu(menu: InsertMenu): Promise<Menu>;
  updateMenu(id: number, menu: Partial<InsertMenu>): Promise<Menu>;
  deleteMenu(id: number): Promise<void>;
  
  // Menu item methods
  getMenuItems(menuId?: number): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string, menuId?: number): Promise<MenuItem[]>;
  createMenuItem(item: InsertMenuItem, menuIds: number[]): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<void>;
  
  // Menu item to menu assignment methods
  assignMenuItemToMenus(menuItemId: number, menuIds: number[]): Promise<void>;
  removeMenuItemFromMenus(menuItemId: number, menuIds: number[]): Promise<void>;
  getMenuItemMenus(menuItemId: number): Promise<Menu[]>;
  getMenuItemsWithMenus(): Promise<(MenuItem & { menus: Menu[] })[]>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  
  // Analytics methods
  getOrderStats(startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    popularItems: { name: string; count: number }[];
  }>;
  
  // QR Code methods
  generateOrderNumber(): string;
  
  // Cart methods
  createCart(cart: InsertCart): Promise<Cart>;
  getCart(cartId: string): Promise<Cart | undefined>;
  updateCart(cartId: string, cart: Partial<InsertCart>): Promise<Cart>;
  deleteCart(cartId: string): Promise<void>;
  
  // Sold-out methods
  markItemSoldOut(itemId: number, soldOut: boolean): Promise<MenuItem>;
  
  // Inventory methods
  getInventory(): Promise<InventoryItem[]>;
  getInventoryLowStock(): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem>;
  archiveInventoryItem(id: number): Promise<void>;
  clearInventory(): Promise<void>;
  adjustInventoryItem(adjustment: InsertInventoryAdjustment): Promise<InventoryItem>;
  
  // Inventory adjustment log methods
  getInventoryAdjustments(): Promise<InventoryAdjustment[]>;
  getInventoryAdjustmentsByItem(itemId: number): Promise<InventoryAdjustment[]>;
  createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getMenus(): Promise<Menu[]> {
    return await db.select().from(menus).where(eq(menus.isActive, true)).orderBy(menus.sortOrder);
  }

  async getMenuById(id: number): Promise<Menu | undefined> {
    const [menu] = await db.select().from(menus).where(eq(menus.id, id));
    return menu || undefined;
  }

  async createMenu(menu: InsertMenu): Promise<Menu> {
    const [newMenu] = await db
      .insert(menus)
      .values(menu)
      .returning();
    return newMenu;
  }

  async updateMenu(id: number, menu: Partial<InsertMenu>): Promise<Menu> {
    const [updated] = await db
      .update(menus)
      .set(menu)
      .where(eq(menus.id, id))
      .returning();
    return updated;
  }

  async deleteMenu(id: number): Promise<void> {
    await db.update(menus).set({ isActive: false }).where(eq(menus.id, id));
  }

  async getMenuItems(menuId?: number): Promise<MenuItem[]> {
    if (menuId) {
      // Get menu items for a specific menu through the junction table
      const menuItemIds = await db
        .select({ menuItemId: menuItemsToMenus.menuItemId })
        .from(menuItemsToMenus)
        .where(eq(menuItemsToMenus.menuId, menuId));
      
      if (menuItemIds.length === 0) {
        return [];
      }
      
      return await db
        .select()
        .from(menuItems)
        .where(and(
          inArray(menuItems.id, menuItemIds.map(item => item.menuItemId).filter(Boolean)),
          eq(menuItems.isActive, true)
        ));
    }
    return await db.select().from(menuItems).where(eq(menuItems.isActive, true));
  }

  async getMenuItemsByCategory(category: string, menuId?: number): Promise<MenuItem[]> {
    if (menuId) {
      // Get menu items for a specific menu and category through the junction table
      const menuItemIds = await db
        .select({ menuItemId: menuItemsToMenus.menuItemId })
        .from(menuItemsToMenus)
        .where(eq(menuItemsToMenus.menuId, menuId));
      
      if (menuItemIds.length === 0) {
        return [];
      }
      
      return await db
        .select()
        .from(menuItems)
        .where(and(
          eq(menuItems.category, category),
          inArray(menuItems.id, menuItemIds.map(item => item.menuItemId).filter(Boolean)),
          eq(menuItems.isActive, true)
        ));
    }
    return await db.select().from(menuItems).where(
      and(eq(menuItems.category, category), eq(menuItems.isActive, true))
    );
  }

  async createMenuItem(item: InsertMenuItem, menuIds: number[]): Promise<MenuItem> {
    const [menuItem] = await db
      .insert(menuItems)
      .values(item)
      .returning();
    
    // Assign the menu item to the specified menus
    if (menuIds.length > 0) {
      await this.assignMenuItemToMenus(menuItem.id, menuIds);
    }
    
    return menuItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>, menuIds?: number[]): Promise<MenuItem> {
    const [updated] = await db
      .update(menuItems)
      .set(item)
      .where(eq(menuItems.id, id))
      .returning();
    
    // Update menu assignments if provided
    if (menuIds !== undefined) {
      // First, remove all existing assignments
      await db.delete(menuItemsToMenus).where(eq(menuItemsToMenus.menuItemId, id));
      
      // Then add new assignments
      if (menuIds.length > 0) {
        await this.assignMenuItemToMenus(id, menuIds);
      }
    }
    
    return updated;
  }

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    const [item] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id))
      .limit(1);
    return item;
  }

  async deleteMenuItem(id: number): Promise<void> {
    await db.update(menuItems).set({ isActive: false }).where(eq(menuItems.id, id));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getOrderStats(startDate?: Date, endDate?: Date): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    popularItems: { name: string; count: number }[];
  }> {
    // Get total orders and revenue
    const ordersQuery = db.select({
      totalOrders: sql<number>`count(*)::int`,
      totalRevenue: sql<number>`sum(${orders.totalAmount})::float`,
    }).from(orders);

    if (startDate && endDate) {
      ordersQuery.where(and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate)
      ));
    }

    const [stats] = await ordersQuery;

    // Calculate average order value
    const averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    // Get popular items (mock data for now since we're storing items as JSON)
    const popularItems = [
      { name: "Strawberry", count: 42 },
      { name: "Vanilla", count: 38 },
      { name: "Chocolate", count: 35 },
      { name: "Cookies & Cream", count: 28 },
      { name: "Pistachio", count: 22 },
    ];

    return {
      totalOrders: stats.totalOrders || 0,
      totalRevenue: stats.totalRevenue || 0,
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      popularItems,
    };
  }

  generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `IC${year}${month}${day}-${timestamp}`;
  }

  // Cart methods
  async createCart(cart: InsertCart): Promise<Cart> {
    const [newCart] = await db
      .insert(carts)
      .values(cart)
      .returning();
    return newCart;
  }

  async getCart(cartId: string): Promise<Cart | undefined> {
    const [cart] = await db.select().from(carts).where(eq(carts.cartId, cartId));
    return cart || undefined;
  }

  async updateCart(cartId: string, cart: Partial<InsertCart>): Promise<Cart> {
    const [updatedCart] = await db
      .update(carts)
      .set({ ...cart, updatedAt: new Date() })
      .where(eq(carts.cartId, cartId))
      .returning();
    return updatedCart;
  }

  async deleteCart(cartId: string): Promise<void> {
    await db.delete(carts).where(eq(carts.cartId, cartId));
  }

  // Sold-out methods
  async markItemSoldOut(itemId: number, soldOut: boolean): Promise<MenuItem> {
    const [updatedItem] = await db
      .update(menuItems)
      .set({ isSoldOut: soldOut })
      .where(eq(menuItems.id, itemId))
      .returning();
    return updatedItem;
  }

  // Menu item to menu assignment methods
  async assignMenuItemToMenus(menuItemId: number, menuIds: number[]): Promise<void> {
    if (menuIds.length === 0) return;
    
    const assignments = menuIds.map(menuId => ({
      menuItemId,
      menuId,
    }));
    
    await db.insert(menuItemsToMenus).values(assignments);
  }

  async removeMenuItemFromMenus(menuItemId: number, menuIds: number[]): Promise<void> {
    if (menuIds.length === 0) return;
    
    await db.delete(menuItemsToMenus).where(
      and(
        eq(menuItemsToMenus.menuItemId, menuItemId),
        inArray(menuItemsToMenus.menuId, menuIds)
      )
    );
  }

  async getMenuItemMenus(menuItemId: number): Promise<Menu[]> {
    return await db
      .select({
        id: menus.id,
        name: menus.name,
        description: menus.description,
        imageUrl: menus.imageUrl,
        isActive: menus.isActive,
        sortOrder: menus.sortOrder,
        orderingFlow: menus.orderingFlow,
        flowConfig: menus.flowConfig,
        pricingRules: menus.pricingRules,
        createdAt: menus.createdAt,
      })
      .from(menus)
      .innerJoin(menuItemsToMenus, eq(menus.id, menuItemsToMenus.menuId))
      .where(eq(menuItemsToMenus.menuItemId, menuItemId))
      .orderBy(menus.sortOrder);
  }

  async getMenuItemsWithMenus(): Promise<(MenuItem & { menus: Menu[] })[]> {
    const allMenuItems = await db.select().from(menuItems);
    const result = [];
    
    for (const menuItem of allMenuItems) {
      const itemMenus = await this.getMenuItemMenus(menuItem.id);
      result.push({ ...menuItem, menus: itemMenus });
    }
    
    return result;
  }

  // Inventory management methods
  async getInventory(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems).where(eq(inventoryItems.archived, false));
  }

  async getInventoryLowStock(): Promise<InventoryItem[]> {
    return await db.select().from(inventoryItems)
      .where(and(eq(inventoryItems.archived, false), lte(inventoryItems.quantity, inventoryItems.parLevel)));
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const [created] = await db.insert(inventoryItems).values({
      ...item,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return created;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem> {
    const [updated] = await db.update(inventoryItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updated;
  }

  async archiveInventoryItem(id: number): Promise<void> {
    await db.update(inventoryItems)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id));
  }

  async adjustInventoryItem(adjustmentData: InsertInventoryAdjustment): Promise<InventoryItem> {
    // Insert log entry
    await db.insert(inventoryAdjustments).values({
      ...adjustmentData,
      createdAt: new Date()
    });
    
    // Update stock
    const [updated] = await db.update(inventoryItems)
      .set({
        quantity: sql`${inventoryItems.quantity} + ${adjustmentData.adjustment}`,
        updatedAt: new Date()
      })
      .where(eq(inventoryItems.id, adjustmentData.inventoryItemId))
      .returning();
    return updated;
  }

  async getInventoryAdjustments(): Promise<InventoryAdjustment[]> {
    return await db.select().from(inventoryAdjustments).orderBy(desc(inventoryAdjustments.createdAt));
  }

  async getInventoryAdjustmentsByItem(itemId: number): Promise<InventoryAdjustment[]> {
    return await db.select().from(inventoryAdjustments)
      .where(eq(inventoryAdjustments.inventoryItemId, itemId))
      .orderBy(desc(inventoryAdjustments.createdAt));
  }

  async createInventoryAdjustment(adjustment: InsertInventoryAdjustment): Promise<InventoryAdjustment> {
    const [created] = await db
      .insert(inventoryAdjustments)
      .values(adjustment)
      .returning();

    // Update the inventory item quantity
    await db
      .update(inventoryItems)
      .set({
        quantity: sql`${inventoryItems.quantity} + ${adjustment.adjustment}`,
        updatedAt: new Date()
      })
      .where(eq(inventoryItems.id, adjustment.inventoryItemId));

    return created;
  }

  async clearInventory(): Promise<void> {
    // Clear adjustments first to avoid foreign key constraint violation
    await db.delete(inventoryAdjustments);
    await db.delete(inventoryItems);
  }
}

export const storage = new DatabaseStorage();
