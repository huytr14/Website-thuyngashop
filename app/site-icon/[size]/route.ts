import { z } from "zod";
import sharp from "sharp";
import { getSiteContent } from "@/db/store";
import { mediaStorage } from "@/lib/media-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = z.enum(["32", "64", "180"]).safeParse((await params).size);
  if (!size.success) return new Response(null, { status: 404 });
  const key = (await getSiteContent()).brand.favicon.split("/").at(-1) ?? "";
  const meta = await mediaStorage.getMeta(key);
  if (!meta) return new Response(null, { status: 404 });
  const bytes = await sharp(meta.bytes).resize(Number(size.data), Number(size.data)).png().toBuffer();
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
