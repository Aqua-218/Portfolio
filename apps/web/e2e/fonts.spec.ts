import { expect, test } from "@playwright/test";

test("フォントはビルドで作った、使う字だけのものを読む", async ({ page }) => {
  const fonts: string[] = [];
  page.on("request", (req) => {
    if (req.resourceType() === "font") fonts.push(new URL(req.url()).pathname);
  });
  await page.goto("/");
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts]
      .filter((f) => f.status === "loaded")
      .map((f) => `${f.family} ${f.weight}`);
  });
  expect(loaded).toContain("LINE Seed JP 400");
  expect(loaded).toContain("Geist 400");
  expect(fonts.length).toBeGreaterThan(0);
  for (const path of fonts)
    expect(path).toMatch(/^\/fonts\/[\w-]+\.\w+\.woff2$/);
});

test("Homeでは、ほかのページにしかない字のフォントは読まない", async ({
  page,
}) => {
  const sizes = new Map<string, number>();
  page.on("response", async (res) => {
    if (res.request().resourceType() === "font")
      sizes.set(res.url(), (await res.body()).length);
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  // 日本語の字はページの順に分けてあるので、Homeは最初のまとまりだけ
  const jp400 = [...sizes.keys()].filter((u) => u.includes("line-seed-jp-400"));
  expect(jp400.length).toBeLessThanOrEqual(2);
  const total = [...sizes.values()].reduce((a, b) => a + b, 0);
  expect(total).toBeLessThan(150_000);
});
