import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  brand: text("brand").notNull(),
  sku: text("sku").notNull().unique(),
  price: integer("price").notNull(),
  stock: integer("stock").notNull().default(0),
  status: text("status", { enum: ["active", "draft"] }).notNull().default("active"),
  image: text("image").notNull().default(""),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  customer: text("customer").notNull(),
  email: text("email").notNull(),
  total: integer("total").notNull(),
  payment: text("payment").notNull(),
  status: text("status", { enum: ["new", "confirmed", "shipping", "completed", "cancelled"] }).notNull().default("new"),
  createdAt: text("created_at").notNull(),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  orders: integer("orders").notNull().default(0),
  spent: integer("spent").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
