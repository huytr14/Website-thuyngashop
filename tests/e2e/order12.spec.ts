import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("biến thể, lightbox, giỏ và đơn COD lưu đúng snapshot", async ({ page }) => {
  const email = `lenh12-${Date.now()}@example.com`;
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    const [product] = await sql`select id, variant_rows from products where slug = 'kirkland-fish-oil-1000-mg'`;
    await page.goto("/san-pham/kirkland-fish-oil-1000-mg");
    await expect(page.locator(".detail-price strong")).toContainText("Từ");
    await page.getByRole("button", { name: "Xem ảnh toàn màn hình" }).click();
    await expect(page.getByRole("dialog", { name: "Xem ảnh sản phẩm" })).toContainText("1/4");
    await page.getByRole("button", { name: "Ảnh sau" }).click();
    await expect(page.getByRole("dialog", { name: "Xem ảnh sản phẩm" })).toContainText("2/4");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Xem ảnh sản phẩm" })).toHaveCount(0);
    await page.getByRole("button", { name: "200 viên" }).click();
    await expect(page.locator(".detail-price strong")).toContainText(product.variant_rows[1].price.toLocaleString("vi-VN"));
    await page.getByRole("button", { name: "THÊM VÀO TÚI" }).click();
    await expect(page.locator(".cart-line")).toContainText("200 viên");
    await expect(page.locator(".cart-line")).toContainText(product.variant_rows[1].price.toLocaleString("vi-VN"));
    await page.getByRole("button", { name: /^THANH TOÁN/ }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Họ và tên").fill("Khách Lệnh 12");
    await page.getByLabel("Số điện thoại").fill("0901234567");
    await page.getByLabel("Địa chỉ").fill("123 Đường Kiểm Thử");
    await page.getByLabel("Tỉnh / Thành phố").fill("TP Hồ Chí Minh");
    await page.getByLabel("Quận / Huyện").fill("Quận 1");
    await page.getByRole("button", { name: /^ĐẶT HÀNG/ }).click();
    await expect(page.getByText(/Mã đơn của bạn là/)).toBeVisible();
    const [item] = await sql`select i.variant_name, i.price from order_items i join orders o on o.id = i.order_id where o.email = ${email} and i.product_id = ${product.id} order by o.id desc limit 1`;
    expect(item.variant_name).toBe("200 viên"); expect(item.price).toBe(product.variant_rows[1].price);
  } finally { await sql`delete from orders where email = ${email}`; await sql.end(); }
});

test("wishlist vãng lai hợp nhất vào tài khoản và mobile không tràn ngang", async ({ page }) => {
  const email = `yeu-thich-${Date.now()}@example.com`;
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/san-pham/kirkland-fish-oil-1000-mg");
    await expect(page.getByRole("navigation", { name: "Điều hướng mobile" }).getByRole("button")).toHaveCount(3);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Yêu thích", exact: true }).click();
    await expect(page.getByRole("button", { name: "Bỏ yêu thích", exact: true })).toBeVisible();
    await page.locator(".product-buy-panel").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(".pdp-sticky-buy")).toBeVisible();
    await page.getByRole("button", { name: "100 viên" }).click();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(".pdp-sticky-buy")).toBeVisible();
    await page.locator(".pdp-sticky-buy").getByRole("button", { name: "Thêm vào túi" }).click();
    await expect(page.locator(".cart-drawer")).toBeVisible();
    await page.locator(".drawer-head button").click();
    await page.getByRole("navigation", { name: "Điều hướng mobile" }).getByRole("button", { name: /Giỏ hàng/ }).click();
    await expect(page.locator(".cart-drawer")).toBeVisible();
    await page.goto("/dang-ky");
    await page.getByLabel("HỌ VÀ TÊN").fill("Khách Wishlist");
    await page.getByLabel("EMAIL").fill(email);
    await page.getByLabel("MẬT KHẨU").fill("TestPassword123!");
    await page.getByRole("button", { name: "ĐĂNG KÝ" }).click();
    await expect(page).toHaveURL(/\/tai-khoan/);
    const mobileNav = page.getByRole("navigation", { name: "Điều hướng mobile" });
    await expect(mobileNav).toBeVisible();
    await mobileNav.getByRole("button", { name: "Danh mục" }).click();
    await expect(page.getByRole("heading", { name: "Danh mục" })).toBeVisible();
    await mobileNav.getByRole("button", { name: "Tìm kiếm" }).click();
    await expect(page.getByLabel("Tìm sản phẩm")).toBeVisible();
    await mobileNav.getByRole("button", { name: /Giỏ hàng/ }).click();
    await expect(page.locator(".cart-drawer")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sản phẩm yêu thích" }).locator("..")).toContainText("Kirkland Fish Oil");
    await expect.poll(async () => { const [row] = await sql`select count(*)::int as count from wishlist_items w join users u on u.id = w.user_id where u.email = ${email}`; return row.count; }).toBe(1);
  } finally { await sql`delete from users where email = ${email}`; await sql.end(); }
});

test("flash áp giá thật; admin sửa nhanh, sửa hàng loạt và doanh thu", async ({ page }, testInfo) => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const email = `flash-${Date.now()}@example.com`;
  const [settings] = await sql`select flash_sale_title, flash_sale_start, flash_sale_end from shop_settings where id = 1`;
  const [product] = await sql`select id,price,old_price,flash_price,flash_stock from products where slug = 'kewpie-sot-me-rang'`;
  const rows = await sql`select id,name,price from products where published = true and id <> ${product.id} and price > 1000 order by id limit 3`;
  try {
    await sql`update shop_settings set flash_sale_title = 'Flash kiểm thử', flash_sale_start = now() - interval '1 minute', flash_sale_end = now() + interval '1 hour' where id = 1`;
    await sql`update products set flash_price = 99000, flash_stock = 5 where id = ${product.id}`;
    await page.waitForTimeout(6000);
    await expect.poll(async () => { await page.goto("/"); return await page.locator(".flash-sale").count(); }, { timeout: 20000 }).toBe(1);
    await expect(page.locator(".flash-sale")).toContainText("Flash kiểm thử");
    await expect(page.locator(".flash-sale")).toContainText("99.000₫");
    await expect(page.locator(".flash-sale progress")).toHaveCount(1);
    await expect(page.locator(".flash-countdown span")).toHaveCount(3);
    await expect(page.locator(".flash-progress small")).toContainText("Đã bán");
    expect(await page.locator(".flash-sale .card-wishlist").first().evaluate((button) => button.getBoundingClientRect().width)).toBe(44);
    await page.locator(".flash-sale").screenshot({ path: testInfo.outputPath("flash-sale.png") });
    const quote = await page.request.post("/api/checkout/quote", { data: { items: [{ productId: product.id, quantity: 1 }], voucherCode: "" } });
    expect((await quote.json()).subtotal).toBe(99000);
    const order = await page.request.post("/api/orders", { headers: { "Idempotency-Key": crypto.randomUUID() }, data: { customerName: "Khách Flash", email, phone: "0901234567", address: "123 Đường Kiểm Thử", city: "TP Hồ Chí Minh", district: "Quận 1", paymentMethod: "COD", items: [{ productId: product.id, quantity: 1 }] } });
    expect(order.status()).toBe(201);
    const [item] = await sql`select i.price from order_items i join orders o on o.id = i.order_id where o.email = ${email} order by o.id desc limit 1`;
    expect(item.price).toBe(99000);
    await sql`update products set flash_price = null where id = ${product.id}`;
    await page.goto("/admin");
    await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    const [revenue] = await sql`select coalesce(sum(total),0)::int as total from orders where status <> 'HUY' and created_at::date = current_date`;
    await expect(page.getByRole("button", { name: /Doanh thu hôm nay/ })).toContainText(revenue.total.toLocaleString("vi-VN"));
    await page.getByRole("button", { name: /Sản phẩm \d+/ }).click();
    await page.getByLabel("Giá bán Kewpie Sốt mè rang").fill("124000");
    await page.locator('[class*="productRow"]').filter({ hasText: "Kewpie Sốt mè rang" }).getByRole("button", { name: "Lưu giá" }).click();
    await expect.poll(async () => { const [row] = await sql`select price from products where id = ${product.id}`; return row.price; }).toBe(124000);
    await page.goto("/san-pham/kewpie-sot-me-rang");
    await expect(page.locator(".detail-price strong")).toContainText("124.000₫");
    await page.goto("/admin");
    await page.getByRole("button", { name: "Sửa hàng loạt" }).click();
    for (const row of rows) await page.getByLabel(`price ${row.name}`, { exact: true }).fill(String(row.price - 1000));
    await page.getByRole("button", { name: "Lưu tất cả" }).click();
    await expect.poll(async () => { const changed = await sql`select id,price from products`; return rows.every((item) => changed.find((row) => row.id === item.id)?.price === item.price - 1000); }).toBe(true);
  } finally {
    await sql`delete from orders where email = ${email}`;
    await sql`update shop_settings set flash_sale_title = ${settings.flash_sale_title}, flash_sale_start = ${settings.flash_sale_start}, flash_sale_end = ${settings.flash_sale_end} where id = 1`;
    await sql`update products set price = ${product.price}, old_price = ${product.old_price}, flash_price = ${product.flash_price}, flash_stock = ${product.flash_stock} where id = ${product.id}`;
    for (const row of rows) await sql`update products set price = ${row.price} where id = ${row.id}`;
    await sql.end();
  }
});
