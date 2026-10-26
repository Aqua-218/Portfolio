import { expect, test } from "@playwright/test";

test("ないページでは迷子の猫が出て、トップに戻れる", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const res = await page.goto("/nai/");
  expect(res?.status()).toBe(404);
  await expect(page).toHaveTitle("404 | 小峯 圭也");
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(
    page.getByText(
      "このページは見つかりませんでした。猫も迷子になっちゃったみたい。",
    ),
  ).toBeVisible();
  await expect(page.locator("main svg.px-svg")).toBeVisible();

  await page.getByRole("link", { name: "とっぷへ", exact: true }).click();
  await expect(page).toHaveURL("/");
});
