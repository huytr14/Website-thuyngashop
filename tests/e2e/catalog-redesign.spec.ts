import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("cây danh mục, sản phẩm TPCN, facet, brand và CSV đường dẫn", async ({ page }) => {
  const suffix = Date.now();
  const categoryName = `Kiểm thử xương khớp ${suffix}`;
  const productName = `TPCN kiểm thử ${suffix}`;
  const csvName = `CSV kiểm thử ${suffix}`;
  const slug = `kiem-thu-xuong-khop-${suffix}`;
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    await page.goto("/admin");
    await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    await page.goto("/admin/danh-muc");
    await page.getByRole("button", { name: /Thêm danh mục gốc/ }).click();
    await page.getByLabel("Tên", { exact: true }).fill(categoryName);
    await expect(page.getByLabel("Slug")).toHaveValue(slug);
    await page.getByLabel("Slug").fill(slug);
    await page.getByLabel("Danh mục cha").selectOption({ label: "Thực phẩm chức năng" });
    await page.getByRole("button", { name: "Lưu danh mục" }).click();
    await expect(page.locator(".category-row").filter({ hasText: categoryName })).toBeVisible();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.locator(".nav-category").filter({ hasText: "THỰC PHẨM CHỨC NĂNG" }).hover();
    await expect(page.getByRole("link", { name: categoryName })).toBeVisible();
    expect(await page.evaluate(() => [...document.querySelectorAll("body *")].filter((element) => element.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map((element) => `${element.tagName}.${element.className}`))).toEqual([]);
    await page.setViewportSize({ width: 1024, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Mở menu" }).click();
    await expect(page.getByRole("link", { name: categoryName })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator(".beauty-category")).toHaveCount(5);
    await expect(page.locator(".department-rail")).toHaveCount(2);

    await page.goto("/admin");
    await page.getByRole("button", { name: /Sản phẩm \d+/ }).click();
    await page.getByRole("button", { name: /THÊM SẢN PHẨM/ }).click();
    await page.getByLabel("Tên sản phẩm").fill(productName);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByText("Đã lưu sản phẩm")).toBeVisible();
    const adminData = await (await page.request.get("/api/admin")).json();
    const draft = adminData.products.find((item: { name: string }) => item.name === productName);
    const child = adminData.categories.find((item: { name: string }) => item.name === categoryName);
    expect(draft.published).toBe(false);
    const published = await page.request.patch(`/api/admin/products/${draft.id}`, { data: { ...draft, brand: "Kirkland", origin: "Mỹ", specification: "Lọ 180 viên", expiryDate: "2027-12-31", image: "/shiseido-eudermine-reference.png", price: 490000, oldPrice: 490000, categoryId: child.id, published: true } });
    expect(published.ok()).toBe(true);
    expect((await page.request.delete(`/api/admin/categories/${child.id}`)).status()).toBe(409);
    await page.goto(`/san-pham/${draft.slug}`);
    await expect(page.getByText("Sản phẩm này không phải là thuốc và không có tác dụng thay thế thuốc chữa bệnh.")).toBeVisible();
    for (const label of ["Thương hiệu", "Xuất xứ", "Quy cách", "Hạn sử dụng"]) await expect(page.locator(".product-specs")).toContainText(label);
    await page.goto("/san-pham/kewpie-sot-me-rang");
    await expect(page.locator(".tpcn-disclaimer")).toHaveCount(0);
    await page.goto(`/danh-muc/${child.slug}`);
    await expect(page.getByText(productName)).toBeVisible();
    await page.getByLabel("Lọc thương hiệu").selectOption("Kirkland");
    await page.getByLabel("Lọc xuất xứ").selectOption("Mỹ");
    await expect(page.locator(".category-products article")).toHaveCount(1);
    await page.goto("/");
    await page.locator(".brand-strip").getByRole("link", { name: "Kirkland" }).click();
    await expect(page).toHaveURL(/brand=Kirkland/);
    await expect(page.locator(".product").first()).toContainText("Kirkland");

    const headers = "ten_san_pham,danh_muc,thuong_hieu,gia_ban,gia_goc,link_anh_chinh,anh_phu,mo_ta_ngan,mo_ta_chi_tiet,bien_the,con_hang";
    const row = `${csvName},Thực phẩm & Đồ uống / Gia vị & Nước sốt,Kewpie,125000,125000,/shiseido-eudermine-reference.png,,Sản phẩm kiểm thử,,,true`;
    const importFile = async (body: string) => page.request.post("/api/admin/products/import", { multipart: { file: { name: "products.csv", mimeType: "text/csv", buffer: Buffer.from(body) } } });
    expect((await importFile(`${headers}\n${row}`)).ok()).toBe(true);
    const wrong = await importFile(`${headers}\n${row.replace("Thực phẩm & Đồ uống / Gia vị & Nước sốt", "Sai / Đường dẫn")}`);
    expect(wrong.status()).toBe(400);
    expect(((await wrong.json()).errors as string[])[0]).toMatch(/^Dòng 2:/);
  } finally {
    await sql`delete from products where name in (${productName}, ${csvName})`;
    await sql`delete from categories where slug = ${slug}`;
    await sql.end();
  }
});
