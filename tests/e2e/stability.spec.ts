import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("logo trong suốt hiển thị ở header desktop và mobile", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.locator(".header").screenshot({ path: testInfo.outputPath("header-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator(".header").screenshot({ path: testInfo.outputPath("header-mobile.png") });
  await page.goto("/tra-cuu-don");
  await expect(page.locator(".public-header img")).toHaveCSS("height", "75px");
  await page.locator(".public-header").screenshot({ path: testInfo.outputPath("public-header-mobile.png") });
});

test("PDP dùng tồn kho catalog: còn 3 mua được, hết 0 khóa nút", async ({ page }, testInfo) => {
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  const email = `catalog-stock-${Date.now()}@example.com`;
  const [product] = await db`select id, track_inventory, inventory_quantity, in_stock from products where slug = 'kewpie-sot-me-rang'`;
  try {
    await db`update products set track_inventory = true, inventory_quantity = 3, in_stock = true where id = ${product.id}`;
    await page.goto("/san-pham/kewpie-sot-me-rang");
    await expect(page.locator(".stock-state")).toContainText("Còn hàng");
    await expect(page.locator(".add-detail")).toBeEnabled();
    await page.screenshot({ path: testInfo.outputPath("pdp-in-stock.png"), fullPage: true });
    const order = await page.request.post("/api/orders", { headers: { "Idempotency-Key": crypto.randomUUID() }, data: { customerName: "Kiểm tồn", email, phone: "0901234567", address: "123 Đường Kiểm Thử", city: "TP Hồ Chí Minh", district: "Quận 1", paymentMethod: "COD", items: [{ productId: product.id, quantity: 1 }] } });
    expect(order.status()).toBe(201);
    const [afterBuy] = await db`select inventory_quantity from products where id = ${product.id}`;
    expect(afterBuy.inventory_quantity).toBe(2);
    await db`update products set inventory_quantity = 0, in_stock = false where id = ${product.id}`;
    await page.waitForTimeout(6000);
    await page.reload();
    await expect(page.locator(".stock-state")).toContainText("Hết hàng");
    await expect(page.locator(".add-detail")).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath("pdp-out-of-stock.png"), fullPage: true });
    await db`update products set track_inventory = false, inventory_quantity = 0, in_stock = true where id = ${product.id}`;
    await page.waitForTimeout(6000);
    await page.reload();
    await expect(page.locator(".add-detail")).toBeEnabled();
  } finally {
    await db`delete from orders where email = ${email}`;
    await db`update products set track_inventory = ${product.track_inventory}, inventory_quantity = ${product.inventory_quantity}, in_stock = ${product.in_stock} where id = ${product.id}`;
    await db.end();
  }
});

test("khách đăng nhập được điền địa chỉ mặc định nhưng sửa SĐT trước khi đặt", async ({ page }, testInfo) => {
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  const email = `prefill-${Date.now()}@example.com`;
  try {
    await page.goto("/dang-ky");
    await page.getByLabel("HỌ VÀ TÊN").fill("Khách Điền Sẵn");
    await page.getByLabel("EMAIL").fill(email);
    await page.getByLabel("MẬT KHẨU").fill("TestPassword123!");
    await page.getByRole("button", { name: "ĐĂNG KÝ" }).click();
    await expect(page).toHaveURL(/\/tai-khoan/);
    const address = await page.request.post("/api/account/addresses", { data: { recipientName: "Khách Điền Sẵn", phone: "0901234567", address: "123 Đường Kiểm Thử", city: "TP Hồ Chí Minh", district: "Quận 1", isDefault: true } });
    expect(address.status()).toBe(201);
    await page.goto("/san-pham/kewpie-sot-me-rang");
    await page.getByRole("button", { name: "THÊM VÀO TÚI" }).click();
    await page.getByRole("button", { name: /^THANH TOÁN/ }).click();
    await expect(page.getByLabel("Email")).toHaveValue(email);
    await expect(page.getByLabel("Họ và tên")).toHaveValue("Khách Điền Sẵn");
    await expect(page.getByLabel("Số điện thoại")).toHaveValue("0901234567");
    await expect(page.getByLabel("Địa chỉ")).toHaveValue("123 Đường Kiểm Thử");
    await page.screenshot({ path: testInfo.outputPath("checkout-prefilled.png"), fullPage: true });
    await page.getByLabel("Số điện thoại").fill("0912345678");
    await page.getByRole("button", { name: /^ĐẶT HÀNG/ }).click();
    await expect(page.getByText(/Mã đơn của bạn là/)).toBeVisible();
    const [order] = await db`select phone from orders where email = ${email} order by id desc limit 1`;
    expect(order.phone).toBe("0912345678");
  } finally { await db`delete from orders where email = ${email}`; await db`delete from users where email = ${email}`; await db.end(); }
});

test("tin tức tự sinh slug và báo thiếu nội dung ngay trên form", async ({ page }, testInfo) => {
  await page.goto("/admin");
  await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  await page.goto("/admin/tin-tuc");
  await page.getByRole("button", { name: /THÊM BÀI VIẾT/ }).click();
  await page.getByLabel("TIÊU ĐỀ").fill("Dưỡng ẩm chuyên sâu");
  await expect(page.getByLabel("SLUG")).toHaveValue("duong-am-chuyen-sau");
  await page.getByRole("button", { name: "LƯU BÀI VIẾT" }).click();
  await expect(page.locator("small[role='alert']")).toContainText("Nội dung cần ít nhất 10 ký tự");
  await page.screenshot({ path: testInfo.outputPath("blog-slug.png"), fullPage: true });
});
