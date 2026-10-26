import { expect, test } from "@playwright/test";
import { ERRORS } from "../src/lib/errors";

for (const [code, { message }] of Object.entries(ERRORS)) {
  test(`${code}の画面に猫と一言とトップへのリンクがある`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/errors/${code}/`);
    await expect(page).toHaveTitle(`${code} | 小峯 圭也`);
    await expect(page.getByRole("heading", { name: code })).toBeVisible();
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.locator("main svg.px-svg")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "とっぷへ", exact: true }),
    ).toHaveAttribute("href", "/");
  });
}
