import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "../lib/password.ts";

test("mật khẩu dùng salt riêng và chỉ khớp với bản gốc", async () => {
  const first = await hashPassword("MatKhau-AnToan-123");
  const second = await hashPassword("MatKhau-AnToan-123");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("MatKhau-AnToan-123", first), true);
  assert.equal(await verifyPassword("sai-mat-khau", first), false);
});
