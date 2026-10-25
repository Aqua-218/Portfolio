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
    page.getByText("使っているもの(2): Rust のロゴ・Zig のロゴ"),
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
  const links = page.locator(
    '#lic-icons a[aria-label$=" の原文"], #lic-fonts a[aria-label$=" の原文"]',
  );
  await expect(links).toHaveCount(12);
  for (const href of await links.evaluateAll((as) =>
    as.map((a) => a.getAttribute("href") ?? ""),
  )) {
    const res = await page.request.get(href);
    expect(res.status(), href).toBe(200);
  }
});

test("コードが使っているライブラリと、その原文を見られる", async ({ page }) => {
  const oss = JSON.parse(
    readFileSync(new URL("../.content/oss.json", import.meta.url), "utf8"),
  ) as {
    npm: { name: string; version: string; license: string; text: string }[];
    cargo: { name: string; version: string }[];
    texts: Record<string, string>;
  };
  await page.goto("/license/");
  const npm = page.locator("#lic-npm");
  await npm.getByText("一覧を見る").click();
  await expect(npm.getByRole("listitem")).toHaveCount(oss.npm.length);
  const react = oss.npm.find((p) => p.name === "react");
  expect(react).toBeDefined();
  if (!react) return;
  const row = npm.getByRole("listitem").filter({
    has: page.getByRole("link", { name: "react", exact: true }),
  });
  await expect(row).toContainText(react.version);
  await row
    .getByRole("link", { name: `react の ${react.license} の原文` })
    .click();
  await expect(page).toHaveURL(`/license/${react.text}/`);
  // reactのパッケージに入っているLICENSEそのもの
  expect(await page.locator("pre").textContent()).toBe(oss.texts[react.text]);
  await expect(page.getByText(/使っているもの\(\d+\):.*react /)).toBeVisible();

  // WebAssemblyにしているクレートも載る
  await page.goto("/license/");
  const cargo = page.locator("#lic-cargo");
  await cargo.getByText("一覧を見る").click();
  await expect(cargo.getByRole("listitem")).toHaveCount(oss.cargo.length);
  await expect(
    cargo.getByRole("link", { name: "wasm-bindgen", exact: true }),
  ).toBeVisible();
});
