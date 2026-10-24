import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator("header svg.px-svg")).toBeAttached();
}

/** モザイクの写真4枚の --py。 */
function offsets(page: Page) {
  return page
    .locator('section[aria-labelledby="h-name"] figure img')
    .evaluateAll((imgs) =>
      imgs.map((im) => (im as HTMLElement).style.getPropertyValue("--py")),
    );
}

test("写真が4枚、AVIFとWebPで幅と高さつきで出る", async ({ page }) => {
  await open(page);
  const imgs = page.locator('section[aria-labelledby="h-name"] figure img');
  await expect(imgs).toHaveCount(4);
  await expect(imgs.first()).toHaveAttribute(
    "alt",
    "三毛の子猫が黒い子猫の頭をなめている",
  );
  await expect(imgs.first()).toHaveAttribute("width", "750");
  await expect(imgs.first()).toHaveAttribute("height", "1000");
  await expect(
    page.locator('section[aria-labelledby="h-name"] source[type="image/avif"]'),
  ).toHaveCount(4);
  // 写真が実際に読める
  await expect
    .poll(() =>
      imgs.first().evaluate((im) => (im as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
});

test("スクロールすると写真がずれて動く", async ({ page }) => {
  await open(page);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => offsets(page)).not.toEqual(["", "", "", ""]);
  const [a, b, c, d] = (await offsets(page)).map((v) => Number.parseFloat(v));
  // 写真ごとに向きと強さが違う
  expect(a).toBeLessThan(0);
  expect(b).toBeGreaterThan(0);
  expect(c).toBeLessThan(0);
  expect(d).toBeGreaterThan(0);
});

test("スマホの幅ではずらさない", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await open(page);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(300);
  expect(await offsets(page)).toEqual(["", "", "", ""]);
});

test("動きを減らす設定ではずらさない", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(300);
  expect(await offsets(page)).toEqual(["", "", "", ""]);
});
