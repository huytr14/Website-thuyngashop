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
  await page.locator(".product-detail-link").first().click();
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

test("mở trang sản phẩm từ trang chủ và đặt COD", async ({ page }) => {
  const email = `e2e-detail-${Date.now()}@example.com`;
  testEmails.add(email);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const copy = await page.locator(".hero-copy").boundingBox();
  const image = await page.locator(".hero-image").boundingBox();
  expect(copy && image && copy.y + copy.height <= image.y).toBeTruthy();
  for (const selector of [".hero-prev", ".hero-next", ".hero-dots button", ".catalog-tabs button", ".product-image .card-buy"]) {
    const height = await page.locator(selector).first().evaluate((element) => element.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(selector.includes("catalog") || selector.includes("card-buy") ? 40 : 44);
  }
  expect(await page.locator(".product h3").first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  expect(await page.locator(".price strong").first().evaluate((element) => parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(15);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator(".product-grid .product-link").first().click();
  await expect(page).toHaveURL(/\/san-pham\/[a-z0-9-]+$/);
  await expect(page.getByRole("heading", { name: "Thông số sản phẩm" })).toBeVisible();
  await page.getByRole("button", { name: "MUA NGAY" }).click();
  await expect(page).toHaveURL(/\/thanh-toan$/);
  await expect(page.getByRole("radio", { name: /COD/ })).toBeChecked();
  const checkoutLabel = await page.locator(".field-grid span").first().evaluate((element) => ({ size: parseFloat(getComputedStyle(element).fontSize), spacing: getComputedStyle(element).letterSpacing }));
  expect(checkoutLabel.size).toBeGreaterThanOrEqual(12);
  expect(checkoutLabel.spacing === "normal" || parseFloat(checkoutLabel.spacing) <= 0.5).toBe(true);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Họ và tên").fill("Khách Playwright");
  await page.getByLabel("Số điện thoại").fill("0901234567");
  await page.getByLabel("Địa chỉ").fill("123 Đường Kiểm Thử");
  await page.getByLabel("Tỉnh / Thành phố").fill("TP Hồ Chí Minh");
  await page.getByLabel("Quận / Huyện").fill("Quận 1");
  await page.getByRole("button", { name: /^ĐẶT HÀNG/ }).click();
  await expect(page.getByText(/Mã đơn của bạn là/)).toBeVisible();
});

test("font Cormorant hiển thị dấu tiếng Việt", async ({ page }) => {
  await page.goto("/");
  const samples = await page.evaluate(async () => {
    const family = getComputedStyle(document.body).getPropertyValue("--font-display").trim();
    return Promise.all(["Sắc đỏ vượt thời gian", "Chăm sóc da", "Dưỡng ẩm chuyên sâu"].map(async (phrase) => {
      const faces = await document.fonts.load(`500 32px ${family}`, phrase);
      const span = document.createElement("span");
      span.textContent = phrase;
      span.style.cssText = `position:absolute;white-space:nowrap;font-family:${family};font-size:32px;font-weight:500;line-height:1.5`;
      document.body.append(span);
      const width = span.getBoundingClientRect().width;
      span.remove();
      return { faces: faces.length, width };
    }));
  });
  for (const sample of samples) { expect(sample.faces).toBeGreaterThan(0); expect(sample.width).toBeGreaterThan(0); }
});
