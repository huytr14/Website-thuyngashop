import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseProductCsv } from "../app/admin-products.ts";

test("parses the two-row product CSV sample", async () => {
  const result = parseProductCsv(await readFile("public/products-sample.csv", "utf8"));
  assert.deepEqual(result.errors, []);
  assert.equal(result.products.length, 2);
  assert.equal(result.products[0].categoryName, "Mỹ phẩm & Chăm sóc / Chăm sóc da");
});

test("reports invalid CSV data by line", () => {
  const csv = "ten_san_pham,danh_muc,thuong_hieu,gia_ban,gia_goc,link_anh_chinh,anh_phu,mo_ta_ngan,mo_ta_chi_tiet,bien_the,con_hang\nSai,Mỹ phẩm & Chăm sóc / Chăm sóc da,A,abc,100,,,,,,maybe";
  const result = parseProductCsv(csv);
  assert.equal(result.products.length, 0);
  assert.match(result.errors[0], /^Dòng 2:/);
});
