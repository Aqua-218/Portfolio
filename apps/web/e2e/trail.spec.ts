import { expect, test, type Page } from "@playwright/test";

/** 足跡のSVG。肉球の形(楕円が5つ)を1歩として数える */
const trails = (page: Page) => page.locator("svg:has(> g > ellipse)");

/** 足跡の位置と向き。読み込みごとに変わらないことを見る */
async function shape(page: Page): Promise<string[]> {
  return trails(page).evaluateAll((svgs) =>
    svgs.flatMap((svg) =>
      [...svg.querySelectorAll("g")].map(
        (g) => g.getAttribute("transform") ?? "",
      ),
    ),
  );
}

test("足跡は読み込むたびに同じところにある", async ({ page }) => {
  await page.goto("/about/");
  const first = await shape(page);
  expect(first.length).toBeGreaterThan(0);
  await page.reload();
  expect(await shape(page)).toEqual(first);
});

test("ページごとに足跡の形が違う", async ({ page }) => {
  await page.goto("/about/");
  const about = await shape(page);
  await page.goto("/skills/");
  expect(await shape(page)).not.toEqual(about);
});

test("スマホの幅では写真の下の足跡を出さず、はみ出さない", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/about/");
  // 区切りの線の上の1つだけが見える
  await expect(trails(page).filter({ visible: true })).toHaveCount(1);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
