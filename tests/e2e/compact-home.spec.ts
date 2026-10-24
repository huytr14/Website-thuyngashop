import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("PDP liền nền trang, ảnh gallery phủ khung", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/san-pham/kewpie-sot-me-rang");
  const panel = page.locator(".product-buy-panel");
  await expect(panel).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(panel).toHaveCSS("border-top-style", "none");
  await expect(page.locator(".product-gallery-main img")).toHaveCSS("object-fit", "cover");
  const galleryBox = await page.locator(".product-gallery").boundingBox();
  const panelBox = await panel.boundingBox();
  expect(Math.abs(galleryBox!.y - panelBox!.y)).toBeLessThan(2);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(panel).toHaveCSS("border-top-style", "none");
});

test("trang chủ tối đa bốn lưới, rail không lặp sản phẩm; chip lọc và sắp xếp", async ({ page }) => {
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  try {
    await page.goto("/");
    await expect(page.locator(".product-first .product").first()).toBeVisible();
    expect(await page.locator(".flash-sale, .product-first, .department-rail").count()).toBeLessThanOrEqual(4);
    const firstTwelve = await page.locator(".product-first .product").evaluateAll((nodes) => nodes.slice(0, 12).map((node) => node.id));
    const railIds = await page.locator(".department-rail .product").evaluateAll((nodes) => nodes.map((node) => node.id));
    expect(railIds.every((id) => !firstTwelve.includes(id))).toBe(true);
    for (const rail of await page.locator(".department-rail").all()) {
      expect(await rail.locator(".product").count()).toBeGreaterThanOrEqual(4);
      await expect(rail.locator(".product-card-actions")).toHaveCount(await rail.locator(".product").count());
    }
    await expect(page.locator(".new-products, .price-edit")).toHaveCount(0);
    for (const link of await page.locator(".journal-grid a").all()) await expect(link).toHaveAttribute("href", "/tin-tuc");
    const categoriesY = (await page.locator(".category-section").boundingBox())!.y;
    const featureY = (await page.locator(".feature-banner").boundingBox())!.y;
    expect(featureY).toBeGreaterThan(categoriesY);

    await page.getByRole("button", { name: "Dưới 1 triệu" }).click();
    const idsUnder = await page.locator(".product-first .product").evaluateAll((nodes) => nodes.map((node) => Number(node.id.replace("san-pham-", ""))));
    const prices = await db`select id, price from products where id in ${db(idsUnder)}`;
    expect(prices).toHaveLength(idsUnder.length);
    expect(prices.every((product) => product.price < 1_000_000)).toBe(true);

    await page.getByRole("button", { name: "Mới nhất" }).click();
    await expect(page.getByRole("button", { name: "Mới nhất" })).toHaveAttribute("aria-pressed", "true");
    const newestIds = await page.locator(".product-first .product").evaluateAll((nodes) => nodes.map((node) => Number(node.id.replace("san-pham-", ""))));
    const dates = await db`select id, created_at from products where id in ${db(newestIds)}`;
    const byId = new Map(dates.map((product) => [product.id, new Date(product.created_at).getTime()]));
    expect(newestIds).toEqual([...newestIds].sort((a, b) => byId.get(b)! - byId.get(a)! || b - a));
    await page.getByRole("tab", { name: "Thực phẩm & Đồ uống" }).click();
    await expect(page.getByRole("button", { name: "Dưới 1 triệu" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Mới nhất" })).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Sắp xếp").selectOption("price-asc");
    await expect(page.getByRole("button", { name: "Mới nhất" })).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Dưới 1 triệu" })).toHaveAttribute("aria-pressed", "true");
  } finally { await db.end(); }
});

test("admin Giao diện đọc dữ liệu cũ có key thừa rồi lưu dữ liệu mới", async ({ page }) => {
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  const [row] = await db`select site_content from shop_settings where id = 1`;
  const original = row.site_content;
  try {
    await page.goto("/admin");
    await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    const current = (await (await page.request.get("/api/admin/site")).json()).site;
    const legacy = { ...current, sections: { ...current.sections, newProducts: { enabled: true, title: "Cũ", subtitle: "" }, priceEdit: { enabled: true, title: "Cũ", subtitle: "" } } };
    await db`update shop_settings set site_content = ${db.json(legacy)} where id = 1`;
    await page.goto("/admin/giao-dien");
    await expect(page.getByLabel("Tên hiển thị của shop")).toHaveValue(current.brand.name);
    await expect(page.getByText("Gợi ý cho bạn", { exact: true })).toHaveCount(0);
    await page.getByLabel("Tên hiển thị của shop").fill(`${current.brand.name} kiểm thử`);
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByText("Đã lưu", { exact: true })).toBeVisible();
    const saved = (await (await page.request.get("/api/admin/site")).json()).site;
    expect(saved.sections).not.toHaveProperty("newProducts");
    expect(saved.sections).not.toHaveProperty("priceEdit");
    await page.getByLabel("Tên hiển thị của shop").fill(current.brand.name);
    await page.getByRole("button", { name: "Lưu thay đổi" }).click();
    await expect(page.getByText("Đã lưu", { exact: true })).toBeVisible();
  } finally { await db`update shop_settings set site_content = ${db.json(original)} where id = 1`; await db.end(); }
});
