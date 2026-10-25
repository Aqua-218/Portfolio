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

/** 足跡の置き場所と向き。見出しの下とフッターのそれぞれで、ずれ(margin)と最初の1歩の向き */
async function placement(page: Page): Promise<string[]> {
  return trails(page).evaluateAll((svgs) =>
    svgs.map((svg) => {
      const first = svg.querySelector("g")?.getAttribute("transform") ?? "";
      const rotate = /rotate\(([-\d.]+)\)/.exec(first)?.[1] ?? "";
      return `${svg.style.margin}|${svg.style.marginLeft}|${svg.style.marginRight}|${rotate}|${String(svg.querySelectorAll("g").length)}`;
    }),
  );
}

test("足跡の向き・歩数・置く場所が、ページごとに違う(フッターも)", async ({
  page,
}) => {
  const pages = [
    "/about/",
    "/skills/",
    "/work/",
    "/events/",
    "/cats/",
    "/stack/",
  ];
  const seen: string[][] = [];
  for (const path of pages) {
    await page.goto(path);
    const [section = "", footer = ""] = await placement(page);
    seen.push([section, footer]);
  }
  // 見出しの下も、フッターも、ページの数だけ違うものがある
  expect(new Set(seen.map(([sec]) => sec)).size).toBe(pages.length);
  expect(new Set(seen.map(([, foot]) => foot)).size).toBe(pages.length);
});
