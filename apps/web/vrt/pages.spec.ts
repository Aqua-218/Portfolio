import { expect, test } from "@playwright/test";

// 中身ができたページから足していく
const PAGES = [
  { name: "home", path: "/" },
  { name: "about", path: "/about/" },
  { name: "skills", path: "/skills/" },
  { name: "work", path: "/work/" },
  { name: "affiliations", path: "/affiliations/" },
  { name: "shelf", path: "/shelf/" },
  { name: "license", path: "/license/" },
] as const;

for (const { name, path } of PAGES) {
  test(name, async ({ page }) => {
    await page.goto(path);
    // フォントとドット猫が出そろってから撮る
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("header svg.px-svg")).toBeAttached();
    // 写真が全部読めてから撮る
    await page.waitForFunction(() =>
      [...document.images].every((im) => im.complete && im.naturalWidth > 0),
    );
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
