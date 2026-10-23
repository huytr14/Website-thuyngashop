import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("gợi ý tìm kiếm chọn bằng bàn phím; trang kết quả có sắp xếp và đếm", async ({ page }, testInfo) => {
  await page.goto("/");
  const search = page.locator(".header .search input");
  await search.fill("Kirkland");
  await expect(page.locator(".header .search-suggestions")).toContainText("Kirkland Fish Oil");
  await page.locator(".header .search-suggestions").screenshot({ path: testInfo.outputPath("search-suggestions.png") });
  await search.press("ArrowDown");
  await search.press("Enter");
  await expect(page).toHaveURL(/\/san-pham\/kirkland-fish-oil-1000-mg/);
  await page.goto("/tim-kiem?q=Kirkland");
  await expect(page.getByRole("heading", { name: /Kết quả tìm kiếm/ })).toBeVisible();
  await expect(page.locator(".category-facets")).toContainText(/Có \d+ sản phẩm/);
  await page.locator(".category-facets select").nth(2).selectOption("price-asc");
  await expect(page.locator(".category-products article")).not.toHaveCount(0);
  await page.goto("/?q=Kirkland");
  await expect(page).toHaveURL(/\/tim-kiem\?q=Kirkland/);
});

test("tra cứu đơn đúng SĐT có trạng thái, sai SĐT chỉ có lỗi chung", async ({ page }, testInfo) => {
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  const email = `track-${Date.now()}@example.com`;
  try {
    const [product] = await db`select id from products where slug = 'kewpie-sot-me-rang'`;
    const response = await page.request.post("/api/orders", { headers: { "Idempotency-Key": crypto.randomUUID() }, data: { customerName: "Khách tra cứu", email, phone: "0901234567", address: "123 Đường Kiểm Thử", city: "TP Hồ Chí Minh", district: "Quận 1", paymentMethod: "COD", items: [{ productId: product.id, quantity: 1 }] } });
    expect(response.status()).toBe(201);
    const { order } = await response.json();
    await page.goto("/tra-cuu-don");
    await page.getByLabel("Mã đơn").fill(order.code);
    await page.getByLabel("Số điện thoại đặt hàng").fill("0901234567");
    await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
    await expect(page.getByRole("status")).toContainText(order.code);
    await expect(page.getByRole("status")).toContainText("Kewpie Sốt mè rang");
    await expect(page.getByRole("status")).not.toContainText("123 Đường Kiểm Thử");
    await page.screenshot({ path: testInfo.outputPath("track-order.png"), fullPage: true });
    await page.getByLabel("Số điện thoại đặt hàng").fill("0999999999");
    await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
    await expect(page.getByRole("alert")).toHaveText("Không tìm thấy đơn hàng phù hợp với thông tin đã nhập");
    await expect(page.getByRole("status")).toHaveCount(0);
  } finally { await db`delete from orders where email = ${email}`; await db.end(); }
});

test("xem hai PDP thì rail gần đây ẩn chính sản phẩm hiện tại", async ({ page }) => {
  await page.goto("/san-pham/kewpie-sot-me-rang");
  await page.goto("/san-pham/kirkland-fish-oil-1000-mg");
  const rail = page.locator(".recent-products");
  await expect(rail).toContainText("Kewpie Sốt mè rang");
  await expect(rail).not.toContainText("Kirkland Fish Oil");
  await page.goto("/");
  await expect(page.locator(".recent-products")).toContainText("Kirkland Fish Oil");
});

test("cụm liên hệ mobile lấy link từ cấu hình và ẩn khi mở giỏ", async ({ page }, testInfo) => {
  await page.goto("/admin");
  await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  const original = (await (await page.request.get("/api/admin/site")).json()).site;
  try {
    const saved = await page.request.patch("/api/admin/site", { data: { ...original, footer: { ...original.footer, zalo: "https://zalo.me/example", messenger: "https://m.me/example", hotline: "0901234567" } } });
    expect(saved.status()).toBe(200);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator(".quick-contact a")).toHaveCount(3);
    await page.screenshot({ path: testInfo.outputPath("quick-contact-mobile.png"), fullPage: true });
    await page.getByRole("button", { name: /Mở túi hàng/ }).click();
    await expect(page.locator(".quick-contact")).toBeHidden();
  } finally { await page.request.patch("/api/admin/site", { data: original }); }
});
