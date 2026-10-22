import assert from "node:assert/strict";
import test from "node:test";
import { canChangeOrderStatus, orderCode, shippingFee, voucherDiscount, voucherError } from "../lib/commerce.ts";

test("tính phí giao hàng và voucher bằng số nguyên VND", () => {
  assert.equal(shippingFee(999999, 1000000, 30000), 30000);
  assert.equal(shippingFee(1000000, 1000000, 30000), 0);
  assert.equal(voucherDiscount({ type: "PERCENT", value: 10 }, 999999, 30000), 99999);
  assert.equal(voucherDiscount({ type: "FIXED", value: 2000000 }, 999999, 30000), 999999);
  assert.equal(voucherDiscount({ type: "FREESHIP", value: 0 }, 999999, 30000), 30000);
});

test("từ chối voucher hết hạn, hết lượt và chưa đủ giá trị đơn", () => {
  const voucher = { type: "PERCENT" as const, value: 10, active: true, minOrder: 500000, expiresAt: null, usageLimit: 1, usedCount: 0 };
  assert.match(voucherError(voucher, 400000)!, /tối thiểu/);
  assert.match(voucherError({ ...voucher, usedCount: 1 }, 500000)!, /hết lượt/);
  assert.equal(voucherError(voucher, 500000), null);
});

test("mã đơn và chuyển trạng thái đúng quy tắc", () => {
  assert.match(orderCode(new Date("2026-10-22T00:00:00Z"), 0), /^TNG-20261022-0000$/);
  assert.equal(canChangeOrderStatus("MOI", "DA_XAC_NHAN"), true);
  assert.equal(canChangeOrderStatus("MOI", "HOAN_THANH"), false);
});
