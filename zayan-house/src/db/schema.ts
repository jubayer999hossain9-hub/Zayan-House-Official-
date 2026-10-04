import {
  pgTable,
  pgEnum,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  check,
  customType,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

/* All money values are stored as whole Taka (BDT) integers. */

const id = () => integer("id").primaryKey().generatedAlwaysAsIdentity();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

/* ---------- Enums ---------- */
export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const adminRoleEnum = pgEnum("admin_role", ["super_admin", "staff"]);
export const productStatusEnum = pgEnum("product_status", ["draft", "active", "archived"]);
export const variantStatusEnum = pgEnum("variant_status", ["active", "inactive"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cod", "bkash", "nagad", "card"]);
export const discountTypeEnum = pgEnum("discount_type", ["percent", "fixed"]);

/* ---------- Users / admins / customers ---------- */
export const users = pgTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("customer"),
    isActive: boolean("is_active").notNull().default(true),
    /* Sessions issued before this moment are rejected (set when the password changes). */
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(sql`lower(${t.email})`)],
);

export const admins = pgTable("admins", {
  id: id(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  adminRole: adminRoleEnum("admin_role").notNull().default("staff"),
  createdAt: createdAt(),
});

export const customers = pgTable(
  "customers",
  {
    id: id(),
    userId: integer("user_id")
      .unique()
      .references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("customers_phone_idx").on(t.phone)],
);

export const customerAddresses = pgTable("customer_addresses", {
  id: id(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  label: text("label").notNull().default("Home"),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  area: text("area"),
  city: text("city").notNull(),
  district: text("district").notNull(),
  postalCode: text("postal_code"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ---------- Catalog ---------- */
export const categories = pgTable(
  "categories",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    imageUrl: text("image_url"),
    displayOrder: integer("display_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("categories_order_idx").on(t.displayOrder)],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sku: text("sku").notNull().unique(),
    shortDescription: text("short_description"),
    description: text("description"),
    productDetails: text("product_details"),
    categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
    regularPrice: integer("regular_price").notNull(),
    salePrice: integer("sale_price"),
    costPrice: integer("cost_price"),
    /* Used only when a product has no variants. With variants, stock lives on each variant. */
    stock: integer("stock").notNull().default(0),
    status: productStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isBestseller: boolean("is_bestseller").notNull().default(false),
    isNewArrival: boolean("is_new_arrival").notNull().default(false),
    soldCount: integer("sold_count").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("products_category_idx").on(t.categoryId),
    index("products_status_idx").on(t.status),
    check("products_price_ck", sql`${t.regularPrice} >= 0 AND (${t.salePrice} IS NULL OR (${t.salePrice} >= 0 AND ${t.salePrice} <= ${t.regularPrice}))`),
    check("products_stock_ck", sql`${t.stock} >= 0`),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: id(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: id(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    size: text("size"),
    color: text("color"),
    colorHex: text("color_hex"),
    /* null = use the product's effective price */
    price: integer("price"),
    stock: integer("stock").notNull().default(0),
    status: variantStatusEnum("status").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("product_variants_product_idx").on(t.productId),
    check("variants_stock_ck", sql`${t.stock} >= 0`),
  ],
);

/* ---------- Delivery ---------- */
export const deliveryZones = pgTable("delivery_zones", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  charge: integer("charge").notNull(),
  /* Orders with a subtotal at or above this get free delivery. null = never free. */
  freeDeliveryThreshold: integer("free_delivery_threshold"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/* ---------- Coupons ---------- */
export const coupons = pgTable(
  "coupons",
  {
    id: id(),
    code: text("code").notNull(),
    description: text("description"),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: integer("discount_value").notNull(),
    minOrderAmount: integer("min_order_amount").notNull().default(0),
    maxDiscountAmount: integer("max_discount_amount"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
    usageLimit: integer("usage_limit"),
    perCustomerLimit: integer("per_customer_limit"),
    usedCount: integer("used_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("coupons_code_uq").on(sql`upper(${t.code})`)],
);

/* ---------- Orders ---------- */
export const orders = pgTable(
  "orders",
  {
    id: id(),
    orderNumber: text("order_number").notNull().unique(),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    shippingAddress: text("shipping_address").notNull(),
    shippingArea: text("shipping_area"),
    shippingCity: text("shipping_city").notNull(),
    shippingDistrict: text("shipping_district").notNull(),
    shippingPostalCode: text("shipping_postal_code"),
    deliveryZoneId: integer("delivery_zone_id").references(() => deliveryZones.id, {
      onDelete: "set null",
    }),
    deliveryZoneName: text("delivery_zone_name"),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    deliveryCharge: integer("delivery_charge").notNull().default(0),
    total: integer("total").notNull(),
    couponCode: text("coupon_code"),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("cod"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    status: orderStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    adminNotes: text("admin_notes"),
    /* Whether stock has been given back after a cancellation (prevents double restock). */
    stockRestored: boolean("stock_restored").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("orders_customer_idx").on(t.customerId),
    index("orders_user_idx").on(t.userId),
    index("orders_status_idx").on(t.status),
    index("orders_phone_idx").on(t.phone),
    index("orders_created_idx").on(t.createdAt),
    check("orders_totals_ck", sql`${t.subtotal} >= 0 AND ${t.discount} >= 0 AND ${t.deliveryCharge} >= 0 AND ${t.total} >= 0`),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: id(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: integer("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    /* Snapshots so old orders stay correct even if the product changes later. */
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    size: text("size"),
    color: text("color"),
    imageUrl: text("image_url"),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    lineTotal: integer("line_total").notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    check("order_items_qty_ck", sql`${t.quantity} > 0`),
  ],
);

export const couponUsages = pgTable(
  "coupon_usages",
  {
    id: id(),
    couponId: integer("coupon_id")
      .notNull()
      .references(() => coupons.id, { onDelete: "cascade" }),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    phone: text("phone").notNull(),
    discountAmount: integer("discount_amount").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("coupon_usages_coupon_idx").on(t.couponId), index("coupon_usages_phone_idx").on(t.phone)],
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    method: paymentMethodEnum("method").notNull(),
    provider: text("provider"),
    amount: integer("amount").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    transactionRef: text("transaction_ref"),
    rawPayload: jsonb("raw_payload"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_order_idx").on(t.orderId)],
);

/* ---------- Settings, newsletter, security ---------- */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
  updatedBy: integer("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: id(),
    email: text("email").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(sql`lower(${t.email})`)],
);

/* Database-backed rate limiting (works on serverless, unlike in-memory counters). */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

/* Uploaded product photos are stored in the database and served from /media/[id]. */
export const media = pgTable("media", {
  id: id(),
  data: bytea("data").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: createdAt(),
});
