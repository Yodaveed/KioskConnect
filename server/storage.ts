import { users, menus, menuItems, orders, orderItems, type User, type InsertUser, type Menu, type InsertMenu, type MenuItem, type InsertMenuItem, type Order, type InsertOrder, type OrderItem, type InsertOrderItem } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

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
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem>;
  deleteMenuItem(id: number): Promise<void>;
  
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
      return await db.select().from(menuItems).where(
        and(eq(menuItems.menuId, menuId), eq(menuItems.isActive, true))
      );
    }
    return await db.select().from(menuItems).where(eq(menuItems.isActive, true));
  }

  async getMenuItemsByCategory(category: string, menuId?: number): Promise<MenuItem[]> {
    if (menuId) {
      return await db.select().from(menuItems).where(
        and(eq(menuItems.category, category), eq(menuItems.menuId, menuId), eq(menuItems.isActive, true))
      );
    }
    return await db.select().from(menuItems).where(
      and(eq(menuItems.category, category), eq(menuItems.isActive, true))
    );
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [menuItem] = await db
      .insert(menuItems)
      .values(item)
      .returning();
    return menuItem;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem> {
    const [updated] = await db
      .update(menuItems)
      .set(item)
      .where(eq(menuItems.id, id))
      .returning();
    return updated;
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
}

export const storage = new DatabaseStorage();
