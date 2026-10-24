import { expect, test } from "@playwright/test";

// 中身ができたページから足していく
const PAGES = [{ name: "home", path: "/" }] as const;

for (const { name, path } of PAGES) {
  test(name, async ({ page }) => {
    await page.goto(path);
    // フォントとドット猫が出そろってから撮る
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("header svg.px-svg")).toBeAttached();
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
