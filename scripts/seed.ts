import { existsSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { categories, products } from "../catalog/products.ts";
import { storeCategories, storeProducts, storeShopSettings } from "../db/store-schema.ts";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required in .env.local");
if (products.length !== 30 || new Set(products.map(({ slug }) => slug)).size !== 30) throw new Error("Expected 30 products with unique slugs");

const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client);

try {
  await db.insert(storeShopSettings).values({ id: 1 }).onConflictDoNothing();
  for (const category of categories) {
    await db.insert(storeCategories).values(category).onConflictDoUpdate({ target: storeCategories.slug, set: { name: category.name } });
  }

  const categoryRows = await db.select().from(storeCategories);
  const categoryIds = new Map(categoryRows.map(({ id, name }) => [name, id]));

  for (const product of products) {
    const categoryId = categoryIds.get(product.category);
    if (!categoryId) throw new Error(`Missing category for ${product.name}`);
    const values = { ...product, badge: product.badge ?? null, categoryId };
    const { category: _category, id: _id, ...row } = values;
    await db.insert(storeProducts).values(row).onConflictDoUpdate({ target: storeProducts.slug, set: row });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
} finally {
  await client.end();
}
