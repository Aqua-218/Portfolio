import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator("header svg.px-svg")).toBeAttached();
}

test("しっぽを押すと猫が見つかり、フッターの一言が変わる", async ({ page }) => {
  await open(page);
  const footer = page.locator("footer");
  await expect(footer).toContainText(
    "このサイトに猫が1匹かくれています。見つかった？",
  );

  const tail = page.getByRole("button", { name: "写真のうしろに何かいる" });
  await tail.scrollIntoViewIfNeeded();
  await tail.click();
  await expect(tail).toBeHidden();
  await expect(page.getByText("みつかった…！")).toBeVisible();
  await expect(footer).toContainText("みつけてくれて、ありがとにゃ。");

  // 出てきた猫を押すと鳴く
  await expect(page.getByText("みつかった…！")).toBeHidden({ timeout: 3000 });
  await page.getByRole("button", { name: "見つかった黒猫" }).click();
  await expect(page.getByText(/^(にゃ|にゃー|みゃ)$/)).toBeVisible();
});

test("スマホの幅でしっぽが画面の外にはみ出さない", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await open(page);
  const tail = page.getByRole("button", { name: "写真のうしろに何かいる" });
  await tail.scrollIntoViewIfNeeded();
  const box = await tail.boundingBox();
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
});
