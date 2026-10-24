import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("giá gốc báo lỗi đúng ô rồi lưu giá hợp lệ ra storefront", async ({ page }) => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const [product] = await sql`select id, slug, price, old_price from products where slug = 'kewpie-sot-me-rang'`;
  const nextPrice = product.price + 1000;
  const saves: number[] = [];
  page.on("response", (response) => { if (response.url().endsWith(`/api/admin/products/${product.id}`) && response.request().method() === "PATCH") saves.push(response.status()); });
  try {
    await sql`update products set old_price = price where id = ${product.id}`;
    await page.goto("/admin");
    await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
    await page.goto(`/admin?view=products&edit=${product.id}`);
    const sale = page.getByLabel("Giá bán", { exact: true });
    const original = page.getByLabel("Giá gốc", { exact: true });
    await expect(original).toHaveValue(product.price.toLocaleString("vi-VN"));
    await sale.fill(String(nextPrice));
    await expect(original.locator("..").getByText("Giá gốc phải lớn hơn hoặc bằng giá bán")).toBeVisible();
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(original).toBeVisible();
    expect(saves).toEqual([]);
    const [unchanged] = await sql`select price from products where id = ${product.id}`;
    expect(unchanged.price).toBe(product.price);
    await original.fill(String(nextPrice));
    await expect(original.locator("..").getByText("Giá gốc phải lớn hơn hoặc bằng giá bán")).toHaveCount(0);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu sản phẩm")).toBeVisible();
    expect(saves).toEqual([200]);
    await expect.poll(async () => { const [row] = await sql`select price, old_price from products where id = ${product.id}`; return [row.price, row.old_price]; }).toEqual([nextPrice, nextPrice]);
    await page.goto(`/san-pham/${product.slug}`);
    await expect(page.locator(".detail-price strong")).toContainText(nextPrice.toLocaleString("vi-VN"));
  } finally {
    await sql`update products set price = ${product.price}, old_price = ${product.old_price} where id = ${product.id}`;
    await sql.end();
  }
});
