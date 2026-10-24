import { expect, test } from "@playwright/test";

test("ảnh nghiệm thu admin desktop và mobile", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  for (const [label, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto("/admin");
    if (await page.getByLabel("MẬT KHẨU").isVisible()) {
      await page.getByLabel("MẬT KHẨU").fill(process.env.ADMIN_PASSWORD!);
      await page.getByRole("button", { name: "ĐĂNG NHẬP" }).click();
    }
    await expect(page.getByRole("heading", { name: "Tổng quan" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Doanh thu hôm nay/ })).toBeVisible({ timeout: 20_000 });
    if (label === "mobile") await page.getByRole("button", { name: "Mở điều hướng" }).click();
    await page.screenshot({ path: testInfo.outputPath(`${label}-overview.png`) });
    await page.getByRole("link", { name: /Sản phẩm \d+/ }).click();
    await expect(page.locator('[class*="productRow"]').first().getByRole("checkbox")).toBeVisible();
    await page.locator('[class*="productRow"]').nth(0).getByRole("checkbox").check();
    await page.locator('[class*="productRow"]').nth(1).getByRole("checkbox").check();
    await page.screenshot({ path: testInfo.outputPath(`${label}-products-bulk.png`) });
    await page.getByRole("button", { name: /THÊM SẢN PHẨM/ }).click();
    await page.getByLabel("Tên sản phẩm", { exact: true }).fill("Ảnh nghiệm thu chưa lưu");
    await page.screenshot({ path: testInfo.outputPath(`${label}-editor-sticky.png`) });
    await page.getByRole("button", { name: "Đóng", exact: true }).click();
    await page.getByRole("dialog", { name: "Bỏ thay đổi chưa lưu?" }).getByRole("button", { name: "Bỏ thay đổi" }).click();
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog", { name: "Tìm nhanh toàn cục" })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`${label}-palette.png`) });
  }
});
