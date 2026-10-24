import { expect, test } from "@playwright/test";
import postgres from "postgres";

test("đặt hai món trừ tồn, hủy hoàn đúng một lần và chặn quá tồn", async ({ page }) => {
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  const email = `ton-kho-${Date.now()}@example.com`;
  const [product] = await db`select id, track_inventory, inventory_quantity, in_stock, variant_rows, flash_price, flash_stock from products where slug = 'kewpie-sot-me-rang'`;
  const [settings] = await db`select flash_sale_start, flash_sale_end from shop_settings where id = 1`;
  try {
    await db`update products set track_inventory = true, inventory_quantity = 3, in_stock = true, flash_price = 99000, flash_stock = 3 where id = ${product.id}`;
    await db`update shop_settings set flash_sale_start = now() - interval '1 minute', flash_sale_end = now() + interval '1 hour' where id = 1`;
    const orderInput = { customerName: "Khách kiểm tồn", email, phone: "0901234567", address: "123 Đường Kiểm Thử", city: "TP Hồ Chí Minh", district: "Quận 1", paymentMethod: "COD", items: [{ productId: product.id, quantity: 2 }] };
    const order = await page.request.post("/api/orders", { headers: { "Idempotency-Key": crypto.randomUUID() }, data: orderInput });
    expect(order.status()).toBe(201);
    const [placed] = await db`select id from orders where email = ${email}`;
    const [afterBuy] = await db`select inventory_quantity, flash_stock from products where id = ${product.id}`;
    expect([afterBuy.inventory_quantity, afterBuy.flash_stock]).toEqual([1, 1]);
    const overstock = await page.request.post("/api/orders", { headers: { "Idempotency-Key": crypto.randomUUID() }, data: orderInput });
    expect(overstock.status()).toBe(400);
    await page.goto("/admin");
    await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    const cancelled = await page.request.patch(`/api/admin/orders/${placed.id}`, { data: { status: "HUY" } });
    expect(cancelled.status()).toBe(200);
    const [afterCancel] = await db`select inventory_quantity, flash_stock from products where id = ${product.id}`;
    expect([afterCancel.inventory_quantity, afterCancel.flash_stock]).toEqual([3, 3]);
    const again = await page.request.patch(`/api/admin/orders/${placed.id}`, { data: { status: "HUY" } });
    expect(again.status()).toBe(409);
    const [afterAgain] = await db`select inventory_quantity, flash_stock from products where id = ${product.id}`;
    expect([afterAgain.inventory_quantity, afterAgain.flash_stock]).toEqual([3, 3]);
    const concurrent = await Promise.all([0, 1].map(() => page.request.post("/api/orders", { headers: { "Idempotency-Key": crypto.randomUUID() }, data: orderInput })));
    expect(concurrent.map((response) => response.status()).sort()).toEqual([201, 400]);
    const [winner] = await db`select id from orders where email = ${email} and status <> 'HUY' order by id desc limit 1`;
    expect((await page.request.patch(`/api/admin/orders/${winner.id}`, { data: { status: "HUY" } })).status()).toBe(200);
  } finally {
    await db`delete from orders where email = ${email}`;
    await db`update products set track_inventory = ${product.track_inventory}, inventory_quantity = ${product.inventory_quantity}, in_stock = ${product.in_stock}, variant_rows = ${db.json(product.variant_rows)}, flash_price = ${product.flash_price}, flash_stock = ${product.flash_stock} where id = ${product.id}`;
    await db`update shop_settings set flash_sale_start = ${settings.flash_sale_start}, flash_sale_end = ${settings.flash_sale_end} where id = 1`;
    await db.end();
  }
});

test("biến thể trừ và hoàn cả tồn tổng lẫn tồn dòng", async ({ page }) => {
  const db = postgres(process.env.DATABASE_URL!, { prepare: false });
  const email = `bien-the-ton-${Date.now()}@example.com`;
  const [product] = await db`select id, track_inventory, inventory_quantity, in_stock, variant_rows from products where slug = 'kirkland-fish-oil-1000-mg'`;
  const rows = product.variant_rows.map((row: { name: string; quantity: number }) => ({ ...row, quantity: row.name === "100 viên" ? 3 : 0 }));
  try {
    await db`update products set track_inventory = true, inventory_quantity = 3, in_stock = true, variant_rows = ${db.json(rows)} where id = ${product.id}`;
    const order = await page.request.post("/api/orders", { headers: { "Idempotency-Key": crypto.randomUUID() }, data: { customerName: "Khách biến thể", email, phone: "0901234567", address: "123 Đường Kiểm Thử", city: "TP Hồ Chí Minh", district: "Quận 1", paymentMethod: "COD", items: [{ productId: product.id, variantName: "100 viên", quantity: 2 }] } });
    expect(order.status()).toBe(201);
    const [placed] = await db`select id from orders where email = ${email}`;
    const [afterBuy] = await db`select inventory_quantity, variant_rows from products where id = ${product.id}`;
    expect(afterBuy.inventory_quantity).toBe(1);
    expect(afterBuy.variant_rows.find((row: { name: string }) => row.name === "100 viên").quantity).toBe(1);
    await page.goto("/admin");
    await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    expect((await page.request.patch(`/api/admin/orders/${placed.id}`, { data: { status: "HUY" } })).status()).toBe(200);
    const [afterCancel] = await db`select inventory_quantity, variant_rows from products where id = ${product.id}`;
    expect(afterCancel.inventory_quantity).toBe(3);
    expect(afterCancel.variant_rows.find((row: { name: string }) => row.name === "100 viên").quantity).toBe(3);
  } finally {
    await db`delete from orders where email = ${email}`;
    await db`update products set track_inventory = ${product.track_inventory}, inventory_quantity = ${product.inventory_quantity}, in_stock = ${product.in_stock}, variant_rows = ${db.json(product.variant_rows)} where id = ${product.id}`;
    await db.end();
  }
});

test("storefront không tràn, thẻ thẳng hàng và chữ đọc được", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  for (const width of [320, 390, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".store-note")).toBeVisible();
    await expect(page.locator(".benefits-hero h3")).toHaveText(["Hàng chính hãng", "Giao hàng nhanh", "Đổi trả dễ dàng", "Tư vấn tận tâm"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator(".store-note").evaluate((note) => {
      const middle = note.querySelector(".store-note-center")!.getBoundingClientRect();
      const logo = document.querySelector(".header .brand-logo")!.getBoundingClientRect();
      return middle.bottom <= logo.top;
    })).toBe(true);
    if (width === 390 || width === 1440) await page.screenshot({ path: testInfo.outputPath(width === 390 ? "home-mobile.png" : "home-desktop.png") });
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/danh-muc/thuc-pham-do-uong");
  await expect(page.locator(".category-products article").first()).toBeVisible();
  const buttons = await page.locator(".category-products article").locator("button:last-child, a.category-add").evaluateAll((elements) => elements.slice(0, 4).map((element) => element.getBoundingClientRect().y));
  expect(Math.max(...buttons) - Math.min(...buttons)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: testInfo.outputPath("category.png") });
  for (const width of [1440, 390]) for (const url of ["/", "/danh-muc/thuc-pham-do-uong", "/san-pham/kewpie-sot-me-rang"]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    const small = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const found: string[] = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!parent || !node.textContent?.trim() || parent.closest("script,style,svg,[aria-hidden=true]")) continue;
        const style = getComputedStyle(parent);
        if (style.display === "none" || style.visibility === "hidden" || !parent.getClientRects().length) continue;
        if (Number.parseFloat(style.fontSize) < 12) found.push(`${parent.tagName}.${parent.className}: ${node.textContent.trim().slice(0, 35)} (${style.fontSize})`);
      }
      return found;
    });
    expect(small, `${width}px ${url}: nội dung dưới 12px`).toEqual([]);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/san-pham/kewpie-sot-me-rang");
  await page.locator(".product-buy-panel").screenshot({ path: testInfo.outputPath("pdp-mobile.png") });
  await page.getByRole("button", { name: "THÊM VÀO TÚI" }).click();
  await page.getByRole("button", { name: /^THANH TOÁN/ }).click();
  const placeOrder = await page.getByRole("button", { name: /^ĐẶT HÀNG/ }).boundingBox();
  expect(placeOrder).not.toBeNull();
  expect(Math.abs(placeOrder!.y + placeOrder!.height - 844)).toBeLessThanOrEqual(2);
});
