import { expect, test } from "@playwright/test";

test("図が3枚あり、細かい話は開くと中身が見える", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/stack/");
  await expect(
    page.locator("main figure svg[aria-roledescription]"),
  ).toHaveCount(3);

  const tree = page.getByText("crates/imgpipe/      猫の写真の変換", {
    exact: false,
  });
  await expect(tree).toBeHidden();
  await page.locator("summary", { hasText: "リポジトリの構成" }).click();
  await expect(tree).toBeVisible();

  await page.locator("summary", { hasText: "コーディング規約" }).click();
  await expect(
    page.getByRole("term").filter({ hasText: "pxcat-core" }),
  ).toBeVisible();
});
