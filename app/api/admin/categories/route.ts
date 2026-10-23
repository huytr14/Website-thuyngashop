import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/app/admin-auth";
import { slugify } from "@/app/admin-products";
import { openStoreDb } from "@/db/store";
import { storeCategories, storeMedia } from "@/db/store-schema";

export const categoryInput = z.object({
  name: z.string().trim().min(1).max(100).refine((value) => !/thuốc|thuoc/i.test(value), "Cửa hàng không bán thuốc"),
  slug: z.string().trim().max(100).regex(/^(?:[a-z0-9]+(?:-[a-z0-9]+)*)?$/),
  description: z.string().trim().max(500),
  parentId: z.number().int().positive().nullable(),
  imageMediaId: z.number().int().positive().nullable(),
  sortOrder: z.number().int(),
  isVisible: z.boolean(),
  requiresDisclaimer: z.boolean(),
});

export async function GET() {
  if (!await hasAdminSession()) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const { db, close } = openStoreDb();
  try { return Response.json({ categories: await db.select().from(storeCategories).orderBy(asc(storeCategories.sortOrder), asc(storeCategories.id)) }); }
  finally { await close(); }
}

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const parsed = categoryInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const categories = await db.select().from(storeCategories);
    if (parsed.data.parentId && !categories.some((item) => item.id === parsed.data.parentId && !item.parentId)) return Response.json({ error: "Chỉ hỗ trợ cây danh mục 2 cấp" }, { status: 400 });
    if (parsed.data.imageMediaId && !(await db.select().from(storeMedia).where(eq(storeMedia.id, parsed.data.imageMediaId)).limit(1)).length) return Response.json({ error: "Ảnh không tồn tại" }, { status: 400 });
    const row = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name), requiresDisclaimer: parsed.data.parentId ? false : parsed.data.requiresDisclaimer };
    if (!row.slug) return Response.json({ error: "Slug không hợp lệ" }, { status: 400 });
    if (categories.some((item) => item.slug === row.slug)) return Response.json({ error: "Slug đã tồn tại" }, { status: 409 });
    const [category] = await db.insert(storeCategories).values(row).returning();
    revalidatePath("/");
    return Response.json({ category }, { status: 201 });
  } finally { await close(); }
}
