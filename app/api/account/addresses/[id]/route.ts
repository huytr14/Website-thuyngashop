import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getCustomer } from "@/app/customer-session";
import { openStoreDb } from "@/db/store";
import { storeAddresses } from "@/db/store-schema";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCustomer(request); if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const id = z.coerce.number().int().positive().safeParse((await params).id); if (!id.success) return Response.json({ error: "ID không hợp lệ" }, { status: 400 });
  const { db, close } = openStoreDb(); try { await db.delete(storeAddresses).where(and(eq(storeAddresses.id, id.data), eq(storeAddresses.userId, user.id))); return Response.json({ ok: true }); } finally { await close(); }
}
