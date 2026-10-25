import { expect, test, type Page } from "@playwright/test";

/** 見本の流れ図。ハイドレーションが済んで、ボタンがつくまで待つ */
async function open(page: Page) {
  await page.goto("/markdown/");
  const figure = page.locator("figure.mmd", { has: page.locator("g.node") });
  await expect(figure.getByRole("button", { name: "拡大" })).toBeVisible();
  return figure;
}

const viewBox = (page: Page) =>
  page
    .locator("figure.mmd", { has: page.locator("g.node") })
    .locator("svg")
    .first()
    .getAttribute("viewBox");

test("ノードに乗ると、つながる線とノードが光る", async ({ page }) => {
  const figure = await open(page);
  await figure.locator("g.node", { hasText: "Cats" }).hover();
  const edge = figure.locator('[data-id="L_B_D_0"]');
  await expect(edge).toHaveCSS("opacity", "1");
  // つながっていない線は薄くなる
  await expect(figure.locator('[data-id="L_A_B_0"]')).not.toHaveCSS(
    "opacity",
    "1",
  );
  await expect(figure.locator("g.node", { hasText: "imgpipe" })).toHaveCSS(
    "opacity",
    "1",
  );
});

test("ノードのリンクを押すと、幕が閉じてからリンク先へ行く", async ({
  page,
}) => {
  const figure = await open(page);
  await expect(page.locator("header svg.px-svg")).toBeAttached();
  await figure.locator("a", { hasText: "Cats" }).click();
  // ふつうのリンクと同じく、幕が閉じきるまでは前のページにいる
  await expect(page).toHaveURL("/markdown/");
  await expect(page).toHaveURL("/cats/", { timeout: 5000 });
});

test("ボタンで拡大・縮小し、元に戻せる", async ({ page }) => {
  const figure = await open(page);
  const before = await viewBox(page);
  await figure.getByRole("button", { name: "拡大" }).click();
  const zoomed = await viewBox(page);
  expect(zoomed).not.toBe(before);
  const width = (v: string | null) => Number(v?.split(" ")[2]);
  expect(width(zoomed)).toBeLessThan(width(before));
  await figure.getByRole("button", { name: "元の大きさ" }).click();
  expect(await viewBox(page)).toBe(before);
});

test("ドラッグで動かせる", async ({ page }) => {
  const figure = await open(page);
  await figure.getByRole("button", { name: "拡大" }).click();
  const before = await viewBox(page);
  const box = await figure.locator("svg").first().boundingBox();
  if (!box) throw new Error("図がない");
  const x = box.x + box.width / 2;
  const y = box.y + box.height - 5;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 60, y, { steps: 5 });
  await page.mouse.up();
  const after = await viewBox(page);
  expect(Number(after?.split(" ")[0])).toBeGreaterThan(
    Number(before?.split(" ")[0]),
  );
});
