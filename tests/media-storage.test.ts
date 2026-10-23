import assert from "node:assert/strict";
import test from "node:test";
import { detectImageMime, mediaStorage, validateImage } from "../lib/media-storage.ts";
import sharp from "sharp";

const png = Uint8Array.from([137,80,78,71,13,10,26,10,0]);
test("chỉ nhận ảnh đúng MIME và không quá 10 MB", () => {
  assert.equal(detectImageMime(png), "image/png");
  assert.equal(validateImage(new File([png], "anh.png", { type: "image/png" }), png), null);
  assert.match(validateImage(new File([png], "anh.jpg", { type: "image/jpeg" }), png)!, /đúng định dạng/);
  const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>");
  assert.match(validateImage(new File([svg], "anh.svg", { type: "image/svg+xml" }), svg)!, /Chỉ nhận/);
  assert.match(validateImage(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "lon.png", { type: "image/png" }), new Uint8Array(10 * 1024 * 1024 + 1))!, /10 MB/);
});

test("khóa file không hợp lệ không đọc được ngoài uploads", async () => {
  assert.equal(await mediaStorage.getMeta("../.env.local"), null);
  assert.equal(await mediaStorage.getMeta("%2e%2e%2f.env.local"), null);
});

test("lưu WebP nhiều cỡ qua storage adapter và xóa cùng ảnh gốc", async () => {
  const original = await sharp({ create: { width: 20, height: 20, channels: 4, background: "#800028" } }).png().toBuffer();
  const saved = await mediaStorage.save(new File([new Uint8Array(original)], "check.png", { type: "image/png" }));
  try {
    for (const width of [480, 800, 1200]) {
      await mediaStorage.saveVariant(saved.storageKey, width, await sharp(original).resize({ width }).webp({ quality: 80 }).toBuffer());
      const meta = await mediaStorage.getMeta(saved.storageKey, width);
      assert.equal(meta?.mime, "image/webp");
      assert.equal((await sharp(meta!.bytes).metadata()).width, width);
    }
  } finally { await mediaStorage.delete(saved.storageKey); }
  assert.equal(await mediaStorage.getMeta(saved.storageKey), null);
  assert.equal(await mediaStorage.getMeta(saved.storageKey, 480), null);
});
