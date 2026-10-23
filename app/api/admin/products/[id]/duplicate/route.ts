import { eq } from "drizzle-orm";
import { z } from "zod";
import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeProductMedia, storeProducts } from "@/db/store-schema";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = z.coerce.number().int().positive().safeParse((await params).id);
  if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb();
  try {
    return await db.transaction(async (tx) => {
      const [source] = await tx.select().from(storeProducts).where(eq(storeProducts.id, id.data)).limit(1);
      if (!source) return Response.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });
      const links = await tx.select().from(storeProductMedia).where(eq(storeProductMedia.productId, source.id));
      const { id: _id, ...fields } = source;
      const base = `${source.slug}-ban-sao`;
      let slug = base;
      for (let suffix = 2; (await tx.select({ id: storeProducts.id }).from(storeProducts).where(eq(storeProducts.slug, slug)).limit(1)).length; suffix++) slug = `${base}-${suffix}`;
      const [product] = await tx.insert(storeProducts).values({ ...fields, name: `${source.name} (bản sao)`, slug, published: false }).returning();
      if (links.length) await tx.insert(storeProductMedia).values(links.map(({ mediaId, sortOrder, altOverride }) => ({ productId: product.id, mediaId, sortOrder, altOverride })));
      return Response.json({ product }, { status: 201 });
    });
  } finally { await close(); }
}
