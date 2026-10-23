import { mediaStorage } from "@/lib/media-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const meta = await mediaStorage.getMeta((await params).key);
  if (!meta) return new Response("Không tìm thấy ảnh", { status: 404 });
  return new Response(new Uint8Array(meta.bytes), { headers: { "Content-Type": meta.mime, "Content-Length": String(meta.size), "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" } });
}
