import { sql } from "drizzle-orm";
import { boolean, date, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex, varchar, type AnyPgColumn } from "drizzle-orm/pg-core";
import type { SiteContent } from "../lib/site-content";

export const storeUsers = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storeAccounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => storeUsers.id, { onDelete: "cascade" }),
  type: text("type").notNull(), provider: text("provider").notNull(), providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"), access_token: text("access_token"), expires_at: integer("expires_at"),
  token_type: text("token_type"), scope: text("scope"), id_token: text("id_token"), session_state: text("session_state"),
}, (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]);

export const storeSessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => storeUsers.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const storeVerificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(), token: text("token").notNull(), expires: timestamp("expires", { mode: "date" }).notNull(),
}, (token) => [primaryKey({ columns: [token.identifier, token.token] })]);

export const storeAuthenticators = pgTable("authenticators", {
  credentialID: text("credential_id").notNull().unique(),
  userId: text("user_id").notNull().references(() => storeUsers.id, { onDelete: "cascade" }),
  providerAccountId: text("provider_account_id").notNull(), credentialPublicKey: text("credential_public_key").notNull(),
  counter: integer("counter").notNull(), credentialDeviceType: text("credential_device_type").notNull(),
  credentialBackedUp: boolean("credential_backed_up").notNull(), transports: text("transports"),
}, (authenticator) => [primaryKey({ columns: [authenticator.userId, authenticator.credentialID] })]);

export const storeCategories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: varchar("description", { length: 500 }).notNull().default(""),
  parentId: integer("parent_id").references((): AnyPgColumn => storeCategories.id, { onDelete: "restrict" }),
  imageMediaId: integer("image_media_id").references(() => storeMedia.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  requiresDisclaimer: boolean("requires_disclaimer").notNull().default(false),
});

export const storeProducts = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  brand: varchar("brand", { length: 100 }).notNull().default(""),
  origin: varchar("origin", { length: 20 }),
  specification: varchar("specification", { length: 150 }).notNull().default(""),
  expiryDate: date("expiry_date"),
  price: integer("price").notNull().default(0),
  oldPrice: integer("old_price").notNull().default(0),
  image: text("image").notNull().default(""),
  extraImages: jsonb("extra_images").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  shortDescription: text("short_description").notNull().default(""),
  description: text("description").notNull().default(""),
  variant: text("variant").notNull().default(""),
  inStock: boolean("in_stock").notNull().default(true),
  published: boolean("published").notNull().default(true),
  trackInventory: boolean("track_inventory").notNull().default(false),
  inventoryQuantity: integer("inventory_quantity").notNull().default(0),
  variantOptions: jsonb("variant_options").$type<{ name: string; values: string[] }[]>().notNull().default(sql`'[]'::jsonb`),
  variantRows: jsonb("variant_rows").$type<{ name: string; price: number; quantity: number; image?: string }[]>().notNull().default(sql`'[]'::jsonb`),
  flashPrice: integer("flash_price"),
  flashStock: integer("flash_stock"),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  badge: varchar("badge", { length: 50 }),
  categoryId: integer("category_id").references(() => storeCategories.id),
});

export const storeMedia = pgTable("media", {
  id: serial("id").primaryKey(),
  storageKey: text("storage_key").unique(),
  url: text("url").notNull().unique(),
  alt: text("alt").notNull().default(""),
  mime: varchar("mime", { length: 100 }).notNull().default(""),
  sizeBytes: integer("size_bytes").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storeProductMedia = pgTable("product_media", {
  productId: integer("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  mediaId: integer("media_id").notNull().references(() => storeMedia.id, { onDelete: "restrict" }),
  sortOrder: integer("sort_order").notNull(),
  altOverride: text("alt_override"),
}, (item) => [primaryKey({ columns: [item.productId, item.mediaId] })]);

export const storeOrders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  idempotencyKey: varchar("idempotency_key", { length: 100 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 150 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  note: text("note"),
  subtotal: integer("subtotal").notNull(),
  shippingFee: integer("shipping_fee").notNull(),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull(),
  voucherCode: varchar("voucher_code", { length: 50 }),
  paymentMethod: varchar("payment_method", { length: 30 }).notNull(),
  status: varchar("status", { length: 30 }).notNull().default("MOI"),
  customerId: text("customer_id").references(() => storeUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storeOrderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => storeOrders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => storeProducts.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  variantName: text("variant_name"),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull(),
});

export const storeShopSettings = pgTable("shop_settings", {
  id: integer("id").primaryKey().default(1),
  siteContent: jsonb("site_content").$type<SiteContent>().notNull().default(sql`'{}'::jsonb`),
  freeShippingThreshold: integer("free_shipping_threshold").notNull().default(1000000),
  standardShippingFee: integer("standard_shipping_fee").notNull().default(30000),
  flashSaleTitle: text("flash_sale_title").notNull().default("Flash Sale"),
  flashSaleStart: timestamp("flash_sale_start", { withTimezone: true }),
  flashSaleEnd: timestamp("flash_sale_end", { withTimezone: true }),
  bankName: varchar("bank_name", { length: 150 }).notNull().default(""),
  bankAccountName: varchar("bank_account_name", { length: 150 }).notNull().default(""),
  bankAccountNumber: varchar("bank_account_number", { length: 50 }).notNull().default(""),
  vietQrUrl: text("viet_qr_url").notNull().default(""),
  shopEmail: varchar("shop_email", { length: 255 }).notNull().default(""),
  aboutContent: text("about_content").notNull().default("THUYNGA Shop — hàng nhập khẩu chính hãng: thực phẩm chức năng, thực phẩm, trái cây, mỹ phẩm và chăm sóc cá nhân."),
  contactContent: text("contact_content").notNull().default("Hãy để lại lời nhắn, THUYNGA Shop sẽ phản hồi trong thời gian sớm nhất."),
  privacyPolicy: text("privacy_policy").notNull().default("Thông tin khách hàng chỉ được sử dụng để xử lý đơn hàng và hỗ trợ mua sắm."),
  shippingPolicy: text("shipping_policy").notNull().default("Đơn hàng được giao theo phương thức vận chuyển đã chọn khi thanh toán."),
  returnsPolicy: text("returns_policy").notNull().default("Vui lòng liên hệ cửa hàng để được hướng dẫn đổi trả theo tình trạng sản phẩm."),
  termsPolicy: text("terms_policy").notNull().default("Khách hàng chịu trách nhiệm cung cấp thông tin nhận hàng chính xác."),
});

export const storeVouchers = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  type: varchar("type", { length: 20 }).notNull(),
  value: integer("value").notNull().default(0),
  minOrder: integer("min_order").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  perCustomerLimit: integer("per_customer_limit"),
  usageLimit: integer("usage_limit"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const storeAddresses = pgTable("addresses", {
  id: serial("id").primaryKey(), userId: text("user_id").notNull().references(() => storeUsers.id, { onDelete: "cascade" }),
  recipientName: varchar("recipient_name", { length: 150 }).notNull(), phone: varchar("phone", { length: 30 }).notNull(),
  address: text("address").notNull(), district: varchar("district", { length: 100 }).notNull(), city: varchar("city", { length: 100 }).notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const storeWishlistItems = pgTable("wishlist_items", {
  userId: text("user_id").notNull().references(() => storeUsers.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (item) => [primaryKey({ columns: [item.userId, item.productId] })]);

export const storeContactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(), name: varchar("name", { length: 150 }).notNull(), email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }), message: text("message").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storePosts = pgTable("posts", {
  id: serial("id").primaryKey(), title: varchar("title", { length: 250 }).notNull(), slug: varchar("slug", { length: 250 }).notNull().unique(),
  image: text("image").notNull().default(""), content: text("content").notNull(), published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const storeReviews = pgTable("reviews", {
  id: serial("id").primaryKey(), userId: text("user_id").notNull().references(() => storeUsers.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => storeProducts.id, { onDelete: "cascade" }),
  orderId: integer("order_id").notNull().references(() => storeOrders.id, { onDelete: "cascade" }), rating: integer("rating").notNull(),
  title: varchar("title", { length: 150 }).notNull().default(""), content: text("content").notNull(), status: varchar("status", { length: 20 }).notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  shopReply: text("shop_reply"),
}, (review) => [uniqueIndex("reviews_user_product_order_unique").on(review.userId, review.productId, review.orderId)]);
