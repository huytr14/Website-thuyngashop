import assert from "node:assert/strict";
import test from "node:test";
import { parseCart } from "../lib/cart.ts";

test("chỉ nhận giỏ hàng localStorage có id và số lượng hợp lệ", () => {
  assert.deepEqual(parseCart('{"1":2,"bad":3,"4":0,"5":100}'), { 1: 2 });
  assert.deepEqual(parseCart("not-json"), {});
});
