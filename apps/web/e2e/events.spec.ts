import { expect, test } from "@playwright/test";

test("年度ごとの一覧から1件のページに行けて、一覧に戻れる", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/events/");
  await expect(page.getByRole("heading", { name: /^2025/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /^2026/ })).toBeVisible();
  await expect(page.locator("main li time")).toHaveCount(16);

  await page
    .getByRole("link", { name: "セキュリティ・キャンプ全国大会" })
    .click();
  await expect(page).toHaveURL("/events/2026-08-10-seccamp/");
  await expect(page.locator("main time")).toHaveText("8/10–15");
  await expect(page.getByText("@ 多摩 LINK FOREST")).toBeVisible();

  await page.getByRole("link", { name: "イベントの一覧へ" }).click();
  await expect(page).toHaveURL("/events/");
});
