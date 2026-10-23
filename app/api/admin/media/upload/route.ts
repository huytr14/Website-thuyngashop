import { hasAdminSession } from "@/app/admin-auth";
import { openStoreDb } from "@/db/store";
import { storeMedia } from "@/db/store-schema";
import { mediaStorage, validateImage } from "@/lib/media-storage";
import sharp from "sharp";

export async function POST(request: Request) {
  if (!await hasAdminSession()) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const files = form?.getAll("files").filter((value): value is File => value instanceof File) ?? [];
  if (!files.length) return Response.json({ error: "Chưa chọn ảnh" }, { status: 400 });
  const { db, close } = openStoreDb();
  const media = []; const errors = [];
  try {
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { errors.push(`${file.name}: ảnh không được vượt quá 10 MB`); continue; }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const reason = validateImage(file, bytes);
      if (reason) { errors.push(`${file.name}: ${reason}`); continue; }
      let dimensions: { width?: number; height?: number };
      try {
        const info = await sharp(bytes).metadata();
        if (info.format !== { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" }[file.type] || !info.width || !info.height) throw new Error("invalid image");
        dimensions = { width: info.width, height: info.height };
      } catch { errors.push(`${file.name}: ảnh bị lỗi hoặc không đọc được`); continue; }
      const saved = await mediaStorage.save(file);
      try {
        for (const width of [480, 800, 1200]) await mediaStorage.saveVariant(saved.storageKey, width, await sharp(bytes).rotate().resize({ width }).webp({ quality: 80 }).toBuffer());
        const [row] = await db.insert(storeMedia).values({ ...saved, ...dimensions, alt: file.name, mime: file.type, sizeBytes: file.size }).returning(); media.push(row);
      }
      catch { await mediaStorage.delete(saved.storageKey); errors.push(`${file.name}: không thể lưu vào kho`); }
    }
    return Response.json({ media, errors }, { status: media.length ? 200 : 400 });
  } finally { await close(); }
}
