import { eq } from "drizzle-orm";
import { hasAdminSession } from "@/app/admin-auth";
import { productInputSchema } from "@/app/admin-products";
import { openStoreDb } from "@/db/store";
import { storeCategories, storeProducts } from "@/db/store-schema";

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    if (!(await db.select({ id: storeCategories.id }).from(storeCategories).where(eq(storeCategories.id, parsed.data.categoryId)).limit(1)).length) {
      return Response.json({ error: "Danh mục không tồn tại" }, { status: 400 });
    }
    const [product] = await db.insert(storeProducts).values(parsed.data).returning();
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return Response.json({ error: "Slug sản phẩm đã tồn tại" }, { status: 409 });
    throw error;
  } finally { await close(); }
}
