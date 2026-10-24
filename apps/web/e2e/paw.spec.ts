import { expect, test, type Page } from "@playwright/test";

// クリックの肉球は28pxのSVG。フッターの足跡とは別
const paws = 'body > div:has(> svg[width="28"] ellipse)';

/** ハイドレーションが済むまで待つ。ロゴの猫が描かれていれば済んでいる。 */
async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator("header svg.px-svg")).toBeAttached();
}

test("クリックしたところに肉球が出て消える", async ({ page }) => {
  await open(page);
  await page.mouse.click(400, 300);
  const paw = page.locator(paws);
  await expect(paw).toHaveCount(1);

  const box = await paw.boundingBox();
  expect(Math.abs((box?.x ?? 0) + (box?.width ?? 0) / 2 - 400)).toBeLessThan(6);
  expect(Math.abs((box?.y ?? 0) + (box?.height ?? 0) / 2 - 300)).toBeLessThan(
    6,
  );

  // 1.1秒のアニメーションが終わったら消える
  await expect(paw).toHaveCount(0, { timeout: 3000 });
});

test("右クリックでは出さない", async ({ page }) => {
  await open(page);
  await page.mouse.click(400, 300, { button: "right" });
  await page.waitForTimeout(200);
  await expect(page.locator(paws)).toHaveCount(0);
});

test("キーボードの操作では出さない", async ({ page }) => {
  await open(page);
  await page.getByRole("link", { name: "小峯圭也（ホームへ）" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  await expect(page.locator(paws)).toHaveCount(0);
});

test("動きを減らす設定では出さない", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.mouse.click(400, 300);
  await page.waitForTimeout(200);
  await expect(page.locator(paws)).toHaveCount(0);
});
