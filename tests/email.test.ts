import assert from "node:assert/strict";
import test from "node:test";
import { sendOrderEmails } from "../app/order-email.ts";

test("thiếu cấu hình Resend chỉ ghi mã đơn mô phỏng, không lộ dữ liệu khách", async () => {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.EMAIL_FROM;
  const originalInfo = console.info;
  let message = "";
  process.env.RESEND_API_KEY = "";
  process.env.EMAIL_FROM = "";
  console.info = (value) => { message = String(value); };
  try {
    await sendOrderEmails({ code: "TNG-20261023-TEST", customerName: "Khách", customerEmail: "secret@example.com", total: 100000, shopEmail: "shop@example.com", paymentMethod: "COD", bankName: "", bankAccountName: "", bankAccountNumber: "", items: [{ productName: "Sản phẩm", variantName: null, quantity: 1, price: 100000 }] });
    assert.match(message, /TNG-20261023-TEST/);
    assert.doesNotMatch(message, /secret@example.com|shop@example.com/);
  } finally { console.info = originalInfo; if (previousKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousKey; if (previousFrom === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = previousFrom; }
});
