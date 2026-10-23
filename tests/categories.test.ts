import assert from "node:assert/strict";
import test from "node:test";
import { categories, products } from "../catalog/products.ts";
import { categoryDescendants, categoryPath, requiresDisclaimer, visibleCategories } from "../lib/categories.ts";

test("catalog mẫu có 5 ngành, cây 2 cấp và không có thuốc", () => {
  const roots = visibleCategories(categories).filter((item) => !item.parentId);
  assert.deepEqual(roots.map((item) => item.name), ["Thực phẩm chức năng", "Thực phẩm & Đồ uống", "Trái cây nhập khẩu", "Mỹ phẩm & Chăm sóc", "Mẹ & Bé"]);
  assert.ok(products.length >= 24 && products.length <= 30);
  assert.ok(products.every((item) => item.categoryId && categories.some((category) => category.id === item.categoryId)));
  assert.ok(products.every((item) => !/thuốc|thuoc|dayquil|nyquil/i.test(item.name)));
  assert.equal(categoryPath(categories.find((item) => item.name === "Xương khớp")!, categories), "Thực phẩm chức năng / Xương khớp");
  assert.equal(categoryDescendants(roots[0], categories).length, 14);
  assert.equal(requiresDisclaimer(products[0].categoryId!, categories), true);
  assert.equal(requiresDisclaimer(products[8].categoryId!, categories), false);
});
