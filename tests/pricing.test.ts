import assert from "node:assert/strict";
import test from "node:test";
import { canBuy, pricedLine } from "../lib/product-pricing.ts";
import { cartItem, cartKey, parseCart } from "../lib/cart.ts";

test("biến thể đổi giá, tồn và khóa giỏ; flash chỉ trong khung giờ", () => {
  const product = { price: 490000, inStock: true, trackInventory: true, inventoryQuantity: 3, variantRows: [{ name: "100 viên", price: 290000, quantity: 3 }, { name: "200 viên", price: 490000, quantity: 0, image: "/large.jpg" }], flashPrice: 250000, flashStock: 2 };
  const before = { flashSaleStart: "2026-10-23T10:00:00Z", flashSaleEnd: "2026-10-23T12:00:00Z" };
  assert.equal(pricedLine(product, "100 viên", before, new Date("2026-10-23T09:00:00Z"))?.price, 290000);
  assert.equal(pricedLine(product, "100 viên", before, new Date("2026-10-23T11:00:00Z"))?.price, 250000);
  assert.equal(pricedLine(product, "200 viên", before, new Date("2026-10-23T11:00:00Z"))?.inStock, false);
  assert.equal(pricedLine(product, "khác", before), null);
  assert.equal(pricedLine({ price: 100000, inStock: true, variant: "Chai 50ml" }, undefined, {})?.variantName, "Chai 50ml");
  assert.equal(canBuy(product, "100 viên", 2, 2, before, new Date("2026-10-23T11:00:00Z")), true);
  assert.equal(canBuy(product, "100 viên", 3, 3, before, new Date("2026-10-23T11:00:00Z")), false);
  assert.equal(canBuy({ ...product, flashStock: 0 }, "100 viên", 1, 1, before, new Date("2026-10-23T11:00:00Z")), true);
  const key = cartKey(5, "200 viên");
  assert.deepEqual(cartItem(key), { productId: 5, variantName: "200 viên" });
  assert.equal(parseCart(JSON.stringify({ [key]: 2 }))[key], 2);
  assert.deepEqual(parseCart('{"5|%":2}'), {});
});
