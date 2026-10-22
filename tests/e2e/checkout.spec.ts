import { expect, test } from "@playwright/test";
import postgres from "postgres";

const testEmails = new Set<string>();

test.afterEach(async () => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try { for (const email of testEmails) await sql`delete from orders where email = ${email}`; }
  finally { testEmails.clear(); await sql.end(); }
});

test("xem sản phẩm, thêm giỏ, đặt COD và thấy đơn trong admin", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;
  testEmails.add(email);
  await page.goto("/");
  await page.locator(".product-link").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "THÊM VÀO TÚI" }).click();
  await page.getByRole("button", { name: /^THANH TOÁN/ }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Họ và tên").fill("Khách Playwright");
  await page.getByLabel("Số điện thoại").fill("0901234567");
  await page.getByLabel("Địa chỉ").fill("123 Đường Kiểm Thử");
  await page.getByLabel("Tỉnh / Thành phố").fill("TP Hồ Chí Minh");
  await page.getByLabel("Quận / Huyện").fill("Quận 1");
  await page.getByRole("button", { name: /^ĐẶT HÀNG/ }).click();
  const success = page.getByText(/Mã đơn của bạn là/);
  await expect(success).toBeVisible();
  const code = (await success.textContent())?.match(/TNG-\d{8}-[A-Z0-9]{4}/)?.[0];
  expect(code).toBeTruthy();

  await page.goto("/admin");
  await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  await page.getByRole("button", { name: /Đơn hàng/ }).click();
  await expect(page.getByText(code!, { exact: true })).toBeVisible();

});
