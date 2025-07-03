import { pgTable, text, serial, integer, boolean, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'base', 'sauce', 'topping'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  isPremium: boolean("is_premium").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // 'pending', 'preparing', 'completed'
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").notNull(), // Store order items as JSON
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  quantity: integer("quantity").notNull().default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  modifiers: jsonb("modifiers"), // Store modifiers like dairy-free
});

// Relations
export const ordersRelations = relations(orders, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  category: true,
  price: true,
  imageUrl: true,
  isActive: true,
  isPremium: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNumber: true,
  status: true,
  totalAmount: true,
  items: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  price: true,
  modifiers: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
