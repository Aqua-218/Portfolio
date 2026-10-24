import { expect, test } from "@playwright/test";

test("写真が全部並び、押すと大きく見られる", async ({ page }) => {
  await page.goto("/cats/");
  await expect(page.locator("header svg.px-svg")).toBeAttached();
  const opens = page.getByRole("button", { name: "写真を大きく見る" });
  await expect(opens).toHaveCount(27);

  await opens.first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const big = dialog.getByRole("img", {
    name: "三毛の子猫が黒い子猫の頭をなめている",
  });
  await expect(big).toBeVisible();
  await expect
    .poll(() => big.evaluate((im) => (im as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);

  // Escで閉じる
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  // もう一度開いて、押すと閉じる
  await opens.nth(2).click();
  await expect(
    dialog.getByRole("img", {
      name: "ピンクの鈴をくわえてこちらを見上げる黒猫",
    }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "閉じる" }).click();
  await expect(dialog).toBeHidden();
});
