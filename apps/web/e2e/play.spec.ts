import { expect, test } from "@playwright/test";

const grounds = "[data-playground]";

/** その場面の遊び方の並び */
async function acts(page: import("@playwright/test").Page, i = 0) {
  return page
    .locator(grounds)
    .nth(i)
    .locator("[data-act]")
    .evaluateAll((els) => els.map((e) => e.getAttribute("data-act") ?? ""));
}

test("トップでは、猫たちが遊んでいる(5つの遊び)", async ({ page }) => {
  await page.goto("/");
  const home = page.locator('[data-playground="home"]');
  await expect(home).toHaveAttribute("aria-hidden", "true");
  await expect(home.locator("[data-act]")).toHaveCount(5);
  // ドット猫が描けている
  await expect(home.locator("svg.px-svg").first()).toBeAttached();
});

test("どのページにも遊ぶ猫がいて、顔ぶれがページごとに違う", async ({
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
  const seen = new Set<string>();
  for (const path of pages) {
    await page.goto(path);
    const list = await acts(page);
    expect(list.length, path).toBe(3);
    seen.add(list.join(","));
  }
  expect(seen.size).toBe(pages.length);
});

test("動きを減らす設定では、猫も毛玉も止まる", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const home = page.locator('[data-playground="home"]');
  await expect(home.locator("svg.px-svg").first()).toBeAttached();
  const moving = await home.evaluate(
    (root) =>
      [...root.querySelectorAll("*")].filter(
        (el) => getComputedStyle(el).animationName !== "none",
      ).length,
  );
  expect(moving).toBe(0);
});

test("スマホの幅でも、遊ぶ猫ははみ出さない", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ["/", "/about/"]) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, path).toBe(false);
  }
});
