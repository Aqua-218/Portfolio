import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

test("ライセンスの名前を押すと、原文のページへ行く", async ({ page }) => {
  await page.goto("/license/");
  const rust = page.getByRole("listitem").filter({ hasText: "Rust のロゴ" });
  await rust.getByRole("link", { name: "CC BY-SA 4.0 の原文" }).click();
  await expect(page).toHaveURL("/license/cc-by-sa-4/");
  await expect(
    page.getByRole("heading", { name: "CC BY-SA 4.0" }),
  ).toBeVisible();
  // 同じ原文を使うものをまとめて出す
  await expect(
    page.getByText("使っているもの: Rust のロゴ・Zig のロゴ"),
  ).toBeVisible();
  // 原文はファイルのまま
  const body = readFileSync(
    new URL("../../../content/licenses/cc-by-sa-4.txt", import.meta.url),
    "utf8",
  );
  expect(await page.locator("pre").textContent()).toBe(body);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await page.getByRole("link", { name: "ライセンス・クレジットへ" }).click();
  await expect(page).toHaveURL("/license/");
});

test("原文のあるものは、どれもライセンスの名前が原文へのリンクになる", async ({
  page,
}) => {
  await page.goto("/license/");
  const links = page.locator('a[href^="/license/"][aria-label$=" の原文"]');
  await expect(links).toHaveCount(12);
  for (const href of await links.evaluateAll((as) =>
    as.map((a) => a.getAttribute("href") ?? ""),
  )) {
    const res = await page.request.get(href);
    expect(res.status(), href).toBe(200);
  }
});
