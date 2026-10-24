import { expect, test } from "@playwright/test";
import postgres from "postgres";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/admin");
  await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
}

test("Ctrl+K mở đúng sản phẩm; lưu giá hiện toast và hỏi khi bỏ thay đổi", async ({ page }) => {
  test.setTimeout(90_000);
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const [product] = await sql`select id,name,slug,price from products where slug = 'kewpie-sot-me-rang'`;
  try {
    await login(page);
    await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: "Tìm nhanh toàn cục" });
    await palette.getByRole("textbox").fill(product.name);
    await expect(palette.getByRole("option").filter({ hasText: product.name })).toBeVisible();
    await palette.getByRole("textbox").press("Enter");
    await expect(page.getByLabel("Giá bán", { exact: true })).toBeVisible();
    await page.getByLabel("Giá bán", { exact: true }).fill(String(product.price - 1000));
    await expect(page.getByText("Có thay đổi chưa lưu")).toBeVisible();
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu sản phẩm")).toBeVisible();
    await expect.poll(async () => { const [row] = await sql`select price from products where id = ${product.id}`; return row.price; }).toBe(product.price - 1000);
    await page.goto(`/san-pham/${product.slug}`);
    await expect(page.locator(".detail-price strong")).toContainText((product.price - 1000).toLocaleString("vi-VN"));
    await page.goto(`/admin?view=products&edit=${product.id}`);
    await page.getByLabel("Giá bán", { exact: true }).fill(String(product.price - 2000));
    await page.getByRole("button", { name: "Đóng" }).click();
    await expect(page.getByRole("dialog", { name: "Bỏ thay đổi chưa lưu?" })).toBeVisible();
    await page.getByRole("button", { name: "Tiếp tục sửa" }).click();
    await expect(page.getByLabel("Giá bán", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Đóng" }).click();
    await page.getByRole("button", { name: "Bỏ thay đổi" }).click();
  } finally {
    await page.request.post("/api/admin/products/quick", { data: { updates: [{ id: product.id, price: product.price }] } });
    await sql.end();
  }
});

test("tổng quan khớp dữ liệu; đơn đổi trạng thái qua menu; bulk ẩn hai sản phẩm", async ({ page }) => {
  test.setTimeout(90_000);
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const suffix = Date.now();
  const userId = crypto.randomUUID();
  const code = `TNG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${suffix.toString(36).slice(-4).toUpperCase()}`;
  const email = `admin17-${suffix}@example.com`;
  const hidden: { id: number; slug: string }[] = [];
  let orderId = 0;
  try {
    const [product] = await sql`select id,name,price from products where published = true and slug = 'kewpie-sot-me-rang'`;
    await sql`insert into users (id,name,email) values (${userId},'Khách kiểm thử admin',${email})`;
    const [order] = await sql`insert into orders (code,idempotency_key,customer_name,email,phone,address,city,district,subtotal,shipping_fee,discount,total,payment_method,customer_id) values (${code},${crypto.randomUUID()},'Khách kiểm thử admin',${email},'0901234567','123 Đường Kiểm Thử','TP Hồ Chí Minh','Quận 1',${product.price},0,0,${product.price},'COD',${userId}) returning id`;
    orderId = order.id;
    await sql`insert into order_items (order_id,product_id,product_name,price,quantity) values (${orderId},${product.id},${product.name},${product.price},1)`;
    await sql`insert into reviews (user_id,product_id,order_id,rating,title,content,status) values (${userId},${product.id},${orderId},5,'Chờ kiểm thử','Đánh giá đang chờ duyệt trong kiểm thử admin.','PENDING')`;
    const [pendingOrderCount] = await sql`select count(*)::int as count from orders where status = 'MOI'`;
    const [pendingReviewCount] = await sql`select count(*)::int as count from reviews where status = 'PENDING'`;
    await login(page);
    await expect(page.getByRole("button", { name: /Đơn hôm nay \/ chờ xác nhận/ })).toContainText(String(pendingOrderCount.count));
    await expect(page.getByRole("button", { name: /Đánh giá chờ duyệt/ })).toContainText(String(pendingReviewCount.count));
    await page.getByRole("link", { name: /Đơn hàng/ }).click();
    await page.getByLabel("Tìm mã đơn").fill(code);
    await page.getByRole("button", { name: `Hành động đơn ${code}` }).click();
    await page.getByRole("menuitem", { name: "Đã xác nhận" }).click();
    await expect(page.getByRole("dialog", { name: `Đã xác nhận đơn ${code}?` })).toBeVisible();
    await page.getByRole("button", { name: "Xác nhận", exact: true }).click();
    await expect(page.locator(".admin-ui-badge", { hasText: "Đã xác nhận" })).toBeVisible();
    expect(page.url()).toContain("/admin");
    const [changed] = await sql`select status from orders where id = ${orderId}`;
    expect(changed.status).toBe("DA_XAC_NHAN");
    await page.getByRole("link", { name: /Sản phẩm \d+/ }).click();
    await page.getByLabel("Lọc sản phẩm").selectOption("PUBLISHED");
    const rows = page.locator('[class*="productRow"]');
    for (let index = 0; index < 2; index++) { const name = (await rows.nth(index).locator("b").first().textContent())!; const [item] = await sql`select id,slug from products where name = ${name}`; hidden.push({ id: Number(item.id), slug: String(item.slug) }); await rows.nth(index).getByRole("checkbox", { name: `Chọn ${name}` }).check(); }
    await page.getByRole("button", { name: "Ẩn hàng loạt" }).click();
    await page.getByRole("dialog", { name: "Ẩn 2 sản phẩm?" }).getByRole("button", { name: "Xác nhận" }).click();
    await expect.poll(async () => { const found = await sql`select id,published from products where id in ${sql(hidden.map((item) => item.id))}`; return found.every((item) => !item.published); }).toBe(true);
    for (const item of hidden) expect((await page.request.get(`/san-pham/${item.slug}`)).status()).toBe(404);
  } finally {
    if (hidden.length) await page.request.post("/api/admin/products/quick", { data: { updates: hidden.map((item) => ({ id: item.id, published: true })) } });
    if (orderId) await sql`delete from orders where id = ${orderId}`;
    await sql`delete from users where id = ${userId}`;
    await sql.end();
  }
});

test("bulk chỉ cho bước chuyển hợp lệ và cập nhật hai đơn", async ({ page }) => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const codes = [0, 1].map((index) => `TNG-${Date.now()}-${index}`);
  const ids: number[] = [];
  try {
    for (const code of codes) {
      const [order] = await sql`insert into orders (code,idempotency_key,customer_name,email,phone,address,city,district,subtotal,shipping_fee,discount,total,payment_method) values (${code},${crypto.randomUUID()},'Khách kiểm thử bulk','bulk-admin17@example.com','0901234567','123 Đường Kiểm Thử','TP Hồ Chí Minh','Quận 1',100000,0,0,100000,'COD') returning id`;
      ids.push(Number(order.id));
    }
    await login(page);
    await page.getByRole("link", { name: /Đơn hàng/ }).click();
    for (const code of codes) await page.getByRole("checkbox", { name: `Chọn đơn ${code}` }).check();
    await expect(page.locator(".admin-selection-bar")).toContainText("Đã chọn 2 đơn");
    await page.locator(".admin-selection-bar").getByRole("button", { name: "Đã xác nhận" }).click();
    await page.getByRole("dialog", { name: "Đã xác nhận 2 đơn?" }).getByRole("button", { name: "Xác nhận" }).click();
    await expect.poll(async () => (await sql`select status from orders where id in ${sql(ids)}`).every((order) => order.status === "DA_XAC_NHAN")).toBe(true);
  } finally {
    if (ids.length) await sql`delete from orders where id in ${sql(ids)}`;
    await sql.end();
  }
});
