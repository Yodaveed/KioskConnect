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

export const menus = pgTable("menus", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  orderingFlow: text("ordering_flow").default("three-step"), // "three-step", "single-page", "custom"
  flowConfig: jsonb("flow_config"), // JSON config for custom flows
  pricingRules: jsonb("pricing_rules").default('{}'), // Pricing rules for different categories
  createdAt: timestamp("created_at").defaultNow(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'base', 'sauce', 'topping', 'size', 'flavor', 'addon'
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  isPremium: boolean("is_premium").default(false),
  isSoldOut: boolean("is_sold_out").default(false),
  maxQuantity: integer("max_quantity"), // For items like "pick 3 flavors"
  isRequired: boolean("is_required").default(false), // For required selections
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Junction table for many-to-many relationship between menu items and menus
export const menuItemsToMenus = pgTable("menu_items_to_menus", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  menuId: integer("menu_id").references(() => menus.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerName: text("customer_name"),
  status: text("status").notNull().default("pending"), // 'pending', 'preparing', 'completed'
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  items: jsonb("items").notNull(), // Store order items as JSON
  createdAt: timestamp("created_at").defaultNow(),
});

export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  cartId: text("cart_id").notNull().unique(), // UUID for sharing
  customerName: text("customer_name"),
  items: jsonb("items").notNull().default('[]'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
export const menusRelations = relations(menus, ({ many }) => ({
  menuItemsToMenus: many(menuItemsToMenus),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
  menuItemsToMenus: many(menuItemsToMenus),
}));

export const menuItemsToMenusRelations = relations(menuItemsToMenus, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemsToMenus.menuItemId],
    references: [menuItems.id],
  }),
  menu: one(menus, {
    fields: [menuItemsToMenus.menuId],
    references: [menus.id],
  }),
}));

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

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const insertMenuSchema = createInsertSchema(menus).pick({
  name: true,
  description: true,
  isActive: true,
  sortOrder: true,
  orderingFlow: true,
  flowConfig: true,
  pricingRules: true,
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  description: true,
  category: true,
  price: true,
  imageUrl: true,
  isActive: true,
  isPremium: true,
  isSoldOut: true,
  maxQuantity: true,
  isRequired: true,
  sortOrder: true,
});

export const insertMenuItemToMenuSchema = createInsertSchema(menuItemsToMenus).pick({
  menuItemId: true,
  menuId: true,
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNumber: true,
  customerName: true,
  status: true,
  totalAmount: true,
  items: true,
});

export const insertCartSchema = createInsertSchema(carts).pick({
  cartId: true,
  customerName: true,
  items: true,
  totalAmount: true,
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
export type Menu = typeof menus.$inferSelect;
export type InsertMenu = z.infer<typeof insertMenuSchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;
export type MenuItemToMenu = typeof menuItemsToMenus.$inferSelect;
export type InsertMenuItemToMenu = z.infer<typeof insertMenuItemToMenuSchema>;
