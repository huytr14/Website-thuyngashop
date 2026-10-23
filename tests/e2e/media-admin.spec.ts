import { expect, test } from "@playwright/test";
import { readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

test("admin mobile: tải ảnh local, lưu nháp chỉ tên, nhân bản và đưa ảnh lên PDP", async ({ page }) => {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  const name = `Ảnh kiểm thử ${Date.now()}`;
  const slug = `anh-kiem-thu-${Date.now()}`;
  const storageKeys: string[] = [];
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin");
    await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    await page.goto("/admin/thu-vien-anh");
    await page.getByLabel("Chọn ảnh tải lên").setInputFiles([{ name: `${slug}.png`, mimeType: "image/png", buffer: await readFile("public/thuynga-logo.png") }, { name: `${slug}-hai.png`, mimeType: "image/png", buffer: await readFile("public/og.png") }]);
    await expect(page.getByText("Ảnh đã được tải lên")).toBeVisible();
    const library = (await (await page.request.get("/api/admin/media")).json()).media;
    const media = library.find((item: { alt: string }) => item.alt === `${slug}.png`);
    const second = library.find((item: { alt: string }) => item.alt === `${slug}-hai.png`);
    expect(media).toBeTruthy(); expect(second).toBeTruthy(); storageKeys.push(media.storageKey, second.storageKey);
    const image = await page.request.get(media.url); expect(image.ok()).toBe(true); expect(image.headers()["content-type"]).toBe("image/png");
    expect((await page.request.get("/media-file/%2e%2e%2f.env.local")).status()).not.toBe(200);
    await page.goto("/admin");
    await page.getByRole("button", { name: /Sản phẩm \d+/ }).click();
    await page.getByRole("button", { name: /THÊM SẢN PHẨM/ }).click();
    await page.getByLabel("Tên sản phẩm").fill(name);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByRole("button", { name: "Đóng" })).toHaveCount(0);
    const [draft] = await sql`select id, published, slug from products where name = ${name}`;
    expect(draft.published).toBe(false);
    expect((await page.request.get(`/san-pham/${draft.slug}`)).status()).toBe(404);
    await page.locator('[class*="productRow"]').filter({ hasText: name }).getByRole("button", { name: "Nhân bản" }).click();
    await expect(page.getByLabel("Tên sản phẩm")).toHaveValue(`${name} (bản sao)`);
    await page.getByRole("button", { name: "Đóng" }).click();
    const [copy] = await sql`select published from products where name = ${name + " (bản sao)"}`;
    expect(copy.published).toBe(false);
    await page.locator('[class*="productRow"]').filter({ hasText: name }).first().getByRole("button", { name: "Sửa" }).click();
    await page.getByRole("button", { name: /Thêm ảnh từ kho/ }).click();
    const picker = page.getByRole("dialog", { name: "Chọn ảnh" });
    await picker.getByRole("button", { name: new RegExp(`${slug}\\.png`) }).click();
    await picker.getByRole("button", { name: new RegExp(`${slug}-hai\\.png`) }).click();
    await picker.getByRole("button", { name: /Xong/ }).click();
    await page.getByRole("button", { name: "Đưa ảnh xuống" }).first().click();
    await page.getByLabel("Giá bán", { exact: true }).fill("2.780.000");
    await expect(page.getByLabel("Giá bán", { exact: true })).toHaveValue("2.780.000");
    await page.getByLabel("Danh mục").selectOption({ label: "Thực phẩm chức năng" });
    await page.getByLabel("Trạng thái").selectOption("published");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    await expect(page.getByRole("button", { name: "Đóng" })).toHaveCount(0);
    const [published] = await sql`select price, published, image from products where id = ${draft.id}`;
    expect(published.price).toBe(2780000); expect(published.published).toBe(true); expect(published.image).toBe(second.url);
    await page.goto(`/san-pham/${draft.slug}`);
    await expect(page.locator(".product-gallery-main img")).toHaveAttribute("src", second.url);
    await page.getByRole("button", { name: /Xem ảnh 2/ }).click();
    await expect(page.locator(".product-gallery-main img")).toHaveAttribute("src", media.url);
  } finally {
    await sql`delete from products where name in (${name}, ${name + " (bản sao)"})`;
    for (const storageKey of storageKeys) { await sql`delete from media where storage_key = ${storageKey}`; await unlink(join(process.cwd(), "uploads", storageKey)).catch(() => {}); }
    await sql.end();
  }
});

test("upload API yêu cầu admin và báo lỗi theo từng file", async ({ page }) => {
  const png = await readFile("public/thuynga-logo.png");
  const unauthorized = await page.request.post("/api/admin/media/upload", { multipart: { files: { name: "anh.png", mimeType: "image/png", buffer: png } } });
  expect(unauthorized.status()).toBe(401);
  await page.goto("/admin"); await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!); await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
  const result = await page.evaluate(async () => { const form = new FormData(); form.append("files", new File(["<svg/>"], "sai.svg", { type: "image/svg+xml" })); form.append("files", new File(["not a png"], "gia.png", { type: "image/png" })); form.append("files", new File([new Uint8Array(10 * 1024 * 1024 + 1)], "lon.png", { type: "image/png" })); const response = await fetch("/api/admin/media/upload", { method: "POST", body: form }); return { status: response.status, body: await response.json() }; });
  expect(result.status).toBe(400);
  expect(result.body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/^sai\.svg:/), expect.stringMatching(/^gia\.png:/), expect.stringMatching(/^lon\.png:/)]));
  const mixed = await page.evaluate(async () => { const bytes = await (await fetch("/thuynga-logo.png")).arrayBuffer(); const form = new FormData(); form.append("files", new File([bytes], "hop-le.png", { type: "image/png" })); form.append("files", new File(["<svg/>"], "sai.svg", { type: "image/svg+xml" })); const response = await fetch("/api/admin/media/upload", { method: "POST", body: form }); return { status: response.status, body: await response.json() }; });
  expect(mixed.status).toBe(200); expect(mixed.body.media).toHaveLength(1); expect(mixed.body.errors).toEqual([expect.stringMatching(/^sai\.svg:/)]);
  expect(await page.evaluate(async (id) => (await fetch(`/api/admin/media/${id}`, { method: "DELETE" })).status, mixed.body.media[0].id)).toBe(200);
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
  try { const [linked] = await sql`select media_id from product_media limit 1`; const blocked = await page.evaluate(async (id) => { const response = await fetch(`/api/admin/media/${id}`, { method: "DELETE" }); return { status: response.status, body: await response.json() }; }, linked.media_id); expect(blocked.status).toBe(409); expect(blocked.body.usage[0]).toMatch(/Sản phẩm:/); }
  finally { await sql.end(); }
});
