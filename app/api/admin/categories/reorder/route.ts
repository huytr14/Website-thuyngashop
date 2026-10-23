import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeCategories } from "@/db/store-schema";

const schema = z.object({ id: z.number().int().positive(), delta: z.union([z.literal(-1), z.literal(1)]) });

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Thứ tự không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const rows = await db.select().from(storeCategories).orderBy(asc(storeCategories.sortOrder), asc(storeCategories.id));
    const current = rows.find((item) => item.id === parsed.data.id);
    if (!current) return Response.json({ error: "Danh mục không tồn tại" }, { status: 404 });
    const siblings = rows.filter((item) => item.parentId === current.parentId);
    const index = siblings.findIndex((item) => item.id === current.id);
    const next = siblings[index + parsed.data.delta];
    if (!next) return Response.json({ categories: rows });
    siblings.splice(index, 1);
    siblings.splice(index + parsed.data.delta, 0, current);
    await db.transaction(async (tx) => { for (const [position, item] of siblings.entries()) await tx.update(storeCategories).set({ sortOrder: position }).where(eq(storeCategories.id, item.id)); });
    revalidatePath("/");
    return Response.json({ categories: await db.select().from(storeCategories).orderBy(asc(storeCategories.sortOrder), asc(storeCategories.id)) });
  } finally { await close(); }
}
