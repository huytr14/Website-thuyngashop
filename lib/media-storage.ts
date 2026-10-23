import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), "uploads");
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const keyPattern = /^[0-9a-f-]{36}\.(?:jpg|png|webp|avif)$/;

export function detectImageMime(bytes: Uint8Array) {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 8 && [137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value)) return "image/png";
  const ascii = (start: number, end: number) => new TextDecoder().decode(bytes.subarray(start, end));
  if (bytes.length > 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (bytes.length > 12 && ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}

export function validateImage(file: File, bytes: Uint8Array) {
  if (file.size > 10 * 1024 * 1024) return "Ảnh không được vượt quá 10 MB";
  if (!extensions[file.type] || detectImageMime(bytes) !== file.type) return "Chỉ nhận JPEG, PNG, WebP hoặc AVIF đúng định dạng";
  return null;
}

export const mediaStorage = {
  async save(file: File) {
    const storageKey = `${crypto.randomUUID()}.${extensions[file.type]}`;
    await mkdir(root, { recursive: true });
    await writeFile(join(root, storageKey), new Uint8Array(await file.arrayBuffer()), { flag: "wx" });
    return { storageKey, url: `/media-file/${storageKey}` };
  },
  async delete(storageKey: string) { if (!keyPattern.test(storageKey)) throw new Error("Khóa ảnh không hợp lệ"); await unlink(join(root, storageKey)); },
  async getMeta(storageKey: string) {
    if (!keyPattern.test(storageKey)) return null;
    try { const file = join(root, storageKey); return { bytes: await readFile(file), size: (await stat(file)).size, mime: Object.entries(extensions).find(([, ext]) => storageKey.endsWith(`.${ext}`))?.[0] ?? "application/octet-stream" }; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  },
};
