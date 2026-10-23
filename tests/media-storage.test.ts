import assert from "node:assert/strict";
import test from "node:test";
import { detectImageMime, mediaStorage, validateImage } from "../lib/media-storage.ts";

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
