import { expect, test } from "@playwright/test";

test("ページごとにtitleと説明とOGP画像がある", async ({ page, request }) => {
  await page.goto("/stack/");
  await expect(page).toHaveTitle("Stack | 小峯 圭也");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "このサイトの技術の無駄遣い",
  );
  const image = await page
    .locator('meta[property="og:image"]')
    .getAttribute("content");
  expect(image).toMatch(/\/stack\/opengraph-image\?/);

  // 本番のURLのまま取りに行かず、パスだけ使う
  const res = await request.get(new URL(image ?? "").pathname);
  expect(res.ok()).toBe(true);
  // PNGの先頭の8バイト
  expect([...(await res.body()).subarray(0, 8)]).toEqual([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
});

test("イベントのページのtitleはイベントの名前", async ({ page }) => {
  await page.goto("/events/2026-08-10-seccamp/");
  await expect(page).toHaveTitle("セキュリティ・キャンプ全国大会 | 小峯 圭也");
});
