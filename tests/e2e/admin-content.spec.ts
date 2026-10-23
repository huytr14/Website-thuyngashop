import { expect, test } from "@playwright/test";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

async function adminLogin(page: import("@playwright/test").Page) {
  await page.goto("/admin");
  await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
}

test("giao diện admin đổi logo, thanh thông báo và thứ tự slide ở 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await adminLogin(page);
  const original = await page.evaluate(async () => (await (await fetch("/api/admin/site")).json()).site);
  const keys: string[] = [];
  try {
    const image = await readFile("public/thuynga-logo.png");
    const suffix = Date.now();
    const names = [`e2e-logo-${suffix}.png`, `e2e-hero-${suffix}.png`];
    await page.goto("/admin/thu-vien-anh");
    await page.getByLabel("Chọn ảnh tải lên").setInputFiles(names.map((name) => ({ name, mimeType: "image/png", buffer: image })));
    await expect(page.getByText("Ảnh đã được tải lên")).toBeVisible();
    const library = (await page.evaluate(async () => (await (await fetch("/api/admin/media")).json()).media)) as { id: number; alt: string; url: string; storageKey: string }[];
    const media = names.map((name) => library.find((item) => item.alt === name)!);
    expect(media.every(Boolean)).toBe(true);
    keys.push(...media.map((item: { storageKey: string }) => item.storageKey));
    await page.goto("/admin/giao-dien");
    const brand = page.getByRole("heading", { name: "Nhận diện thương hiệu" }).locator("..");
    await brand.locator(".site-image-field").first().getByRole("button", { name: /Thêm ảnh từ kho/ }).click();
    await page.getByRole("dialog", { name: "Chọn ảnh" }).getByRole("button", { name: new RegExp(names[0]) }).click();
    await page.getByRole("dialog", { name: "Chọn ảnh" }).getByRole("button", { name: /Xong/ }).click();
    await brand.locator(".site-image-field").nth(2).getByRole("button", { name: /Thêm ảnh từ kho/ }).click();
    await page.getByRole("dialog", { name: "Chọn ảnh" }).getByRole("button", { name: new RegExp(names[0]) }).click();
    await page.getByRole("dialog", { name: "Chọn ảnh" }).getByRole("button", { name: /Xong/ }).click();
    const announcement = page.getByRole("heading", { name: "Thanh thông báo" }).locator("..");
    await announcement.getByRole("checkbox").uncheck();
    const hero = page.getByRole("heading", { name: "Hero trang chủ" }).locator("..");
    await hero.getByRole("button", { name: /Thêm slide/ }).click();
    const slide = hero.locator(".site-slide").last();
    await slide.getByLabel("Tiêu đề dòng 1").fill("SLIDE KIỂM THỬ");
    await slide.getByLabel("Tiêu đề nhấn mạnh").fill("LỆNH 10");
    await slide.getByLabel("Mô tả").fill("Ảnh và chữ được sửa trong admin.");
    await slide.getByRole("button", { name: /Thêm ảnh từ kho/ }).click();
    await page.getByRole("dialog", { name: "Chọn ảnh" }).getByRole("button", { name: new RegExp(names[1]) }).click();
    await page.getByRole("dialog", { name: "Chọn ảnh" }).getByRole("button", { name: /Xong/ }).click();
    await slide.getByRole("button", { name: "Đưa slide 3 lên" }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByText("Đã lưu", { exact: true })).toBeVisible();
    const blocked = await page.evaluate(async (id) => (await fetch(`/api/admin/media/${id}`, { method: "DELETE" })).status, (library.find((item) => item.alt === names[0]) as { id: number }).id);
    expect(blocked).toBe(409);
    await page.goto("/");
    await expect(page.locator(".header .logo img")).toHaveAttribute("src", media[0].url);
    const icon = await page.request.get("/site-icon/32");
    expect(icon.status()).toBe(200);
    expect(icon.headers()["content-type"]).toContain("image/png");
    await expect(page.locator(".store-note")).toHaveCount(0);
    await page.getByRole("button", { name: "Banner 2" }).click();
    await expect(page.locator(".hero-copy h1")).toContainText("SLIDE KIỂM THỬ");
    await expect(page.locator(".hero-image img")).toHaveAttribute("src", media[1].url);
  } finally {
    const restored = await page.evaluate(async (site) => (await fetch("/api/admin/site", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(site) })).ok, original).catch(() => false);
    if (!restored) throw new Error("Không thể khôi phục giao diện sau test; giữ nguyên ảnh để tránh hỏng trang");
    const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
    try { for (const key of keys) { await sql`delete from media where storage_key = ${key}`; await unlink(join(process.cwd(), "uploads", key)).catch(() => {}); } }
    finally { await sql.end(); }
  }
});

test("voucher áp vào đơn COD, khách hiện trong admin và shop trả lời đánh giá", async ({ page }) => {
  const email = `lenh10-${Date.now()}@example.com`;
  const code = `L10${Date.now()}`;
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    await page.goto("/dang-ky");
    await page.getByLabel("HỌ VÀ TÊN").fill("Khách Lệnh 10");
    await page.getByLabel("EMAIL").fill(email);
    await page.getByLabel("MẬT KHẨU").fill("TestPassword123!");
    await page.getByRole("button", { name: "ĐĂNG KÝ" }).click();
    await expect(page).toHaveURL(/\/tai-khoan/);
    await adminLogin(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/ma-giam-gia");
    await page.getByRole("button", { name: /Tạo mã giảm giá/ }).click();
    await page.getByRole("textbox", { name: "Mã giảm giá" }).fill(code.toLowerCase());
    await page.getByRole("button", { name: "Lưu mã" }).click();
    await expect(page.getByText(code, { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto("/");
    await page.goto("/san-pham/kirkland-fish-oil-1000-mg");
    await expect(page.locator(".pdp-vouchers")).toContainText(code);
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.locator(".pdp-vouchers > div").filter({ hasText: code }).getByRole("button", { name: "Sao chép" }).click();
    await expect(page.getByText(`Đã sao chép mã ${code}`)).toBeVisible();
    await page.getByRole("button", { name: "200 viên" }).click();
    await page.getByRole("button", { name: "THÊM VÀO TÚI" }).click();
    await page.goto("/thanh-toan");
    await page.getByPlaceholder("Mã giảm giá").fill(code);
    await page.getByRole("button", { name: "ÁP DỤNG" }).click();
    await expect(page.getByText(`Đã áp dụng mã ${code}`)).toBeVisible();
    const [product] = await sql`select id,slug,price from products where published = true order by id limit 1`;
    await expect(page.locator(".totals")).toContainText(`−${Math.floor(product.price * 0.1).toLocaleString("vi-VN")}₫`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Họ và tên").fill("Khách Lệnh 10");
    await page.getByLabel("Số điện thoại").fill("0901234567");
    await page.getByLabel("Địa chỉ").fill("123 Đường Kiểm Thử");
    await page.getByLabel("Tỉnh / Thành phố").fill("TP Hồ Chí Minh");
    await page.getByLabel("Quận / Huyện").fill("Quận 1");
    await page.getByRole("button", { name: /^ĐẶT HÀNG/ }).click();
    await expect(page.getByText(/Mã đơn của bạn là/)).toBeVisible();
    const [order] = await sql`select id,total,discount,customer_id from orders where email = ${email} order by id desc limit 1`;
    expect(order.discount).toBe(Math.floor(product.price * 0.1));
    expect(order.customer_id).toBeTruthy();
    await page.goto("/admin/khach-hang");
    await page.getByLabel("Tìm khách hàng").fill(email);
    await expect(page.getByText(email).first()).toBeVisible();
    await page.locator(".extra-customer").first().click();
    await expect(page.getByRole("dialog", { name: "Chi tiết khách hàng" })).toContainText("1 đơn");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await sql`update orders set status = 'HOAN_THANH' where id = ${order.id}`;
    const [review] = await sql`insert into reviews (user_id,product_id,order_id,rating,title,content,status) values (${order.customer_id},${product.id},${order.id},5,'Rất tốt','Sản phẩm dùng rất tốt và phù hợp với làn da.','APPROVED') returning id`;
    await page.goto("/admin/danh-gia");
    await page.getByLabel("Lọc đánh giá").selectOption("APPROVED");
    const reply = page.getByLabel(`Phản hồi đánh giá ${review.id}`);
    await reply.fill("THUYNGA Shop cảm ơn bạn đã chia sẻ!");
    await reply.blur();
    await expect.poll(async () => { const [row] = await sql`select shop_reply from reviews where id = ${review.id}`; return row.shop_reply; }).toBe("THUYNGA Shop cảm ơn bạn đã chia sẻ!");
    await page.goto(`/san-pham/${product.slug}`);
    await expect(page.getByText("Phản hồi từ THUYNGA Shop")).toBeVisible();
    await expect(page.getByText("THUYNGA Shop cảm ơn bạn đã chia sẻ!")).toBeVisible();
  } finally {
    await sql`delete from orders where email = ${email}`;
    await sql`delete from users where email = ${email}`;
    await sql`delete from vouchers where code = ${code}`;
    await sql.end();
  }
});
