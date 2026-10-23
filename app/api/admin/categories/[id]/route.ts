import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hasAdminSession } from "@/app/admin-auth";
import { slugify } from "@/app/admin-products";
import { openStoreDb } from "@/db/store";
import { storeCategories, storeMedia, storeProducts } from "@/db/store-schema";
import { categoryInput } from "../route";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  if (!await hasAdminSession()) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const id = Number((await params).id);
  const parsed = categoryInput.safeParse(await request.json().catch(() => null));
  if (!Number.isSafeInteger(id) || id < 1 || !parsed.success) return Response.json({ error: parsed.success ? "ID không hợp lệ" : parsed.error.issues[0].message }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const categories = await db.select().from(storeCategories).orderBy(asc(storeCategories.sortOrder));
    const original = categories.find((item) => item.id === id);
    if (!original) return Response.json({ error: "Danh mục không tồn tại" }, { status: 404 });
    if (parsed.data.parentId && !categories.some((item) => item.id === parsed.data.parentId && !item.parentId && item.id !== id)) return Response.json({ error: "Chỉ hỗ trợ cây danh mục 2 cấp" }, { status: 400 });
    if (parsed.data.parentId && categories.some((item) => item.parentId === id)) return Response.json({ error: "Không thể chuyển danh mục có danh mục con thành cấp 2" }, { status: 409 });
    if (parsed.data.imageMediaId && !(await db.select({ id: storeMedia.id }).from(storeMedia).where(eq(storeMedia.id, parsed.data.imageMediaId)).limit(1)).length) return Response.json({ error: "Ảnh không tồn tại" }, { status: 400 });
    const row = { ...parsed.data, slug: parsed.data.slug || slugify(parsed.data.name), requiresDisclaimer: parsed.data.parentId ? false : parsed.data.requiresDisclaimer };
    if (!row.slug) return Response.json({ error: "Slug không hợp lệ" }, { status: 400 });
    if (categories.some((item) => item.id !== id && item.slug === row.slug)) return Response.json({ error: "Slug đã tồn tại" }, { status: 409 });
    const [category] = await db.update(storeCategories).set(row).where(eq(storeCategories.id, id)).returning();
    revalidatePath("/"); revalidatePath(`/danh-muc/${original.slug}`); revalidatePath(`/danh-muc/${category.slug}`);
    return Response.json({ category });
  } finally { await close(); }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!await hasAdminSession()) return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    const [category] = await db.select().from(storeCategories).where(eq(storeCategories.id, id)).limit(1);
    if (!category) return Response.json({ error: "Danh mục không tồn tại" }, { status: 404 });
    if ((await db.select({ id: storeProducts.id }).from(storeProducts).where(eq(storeProducts.categoryId, id)).limit(1)).length) return Response.json({ error: "Không thể xóa: danh mục đang có sản phẩm." }, { status: 409 });
    if ((await db.select({ id: storeCategories.id }).from(storeCategories).where(eq(storeCategories.parentId, id)).limit(1)).length) return Response.json({ error: "Không thể xóa: danh mục đang có danh mục con." }, { status: 409 });
    await db.delete(storeCategories).where(eq(storeCategories.id, id));
    revalidatePath("/"); revalidatePath(`/danh-muc/${category.slug}`);
    return Response.json({ ok: true });
  } finally { await close(); }
}
