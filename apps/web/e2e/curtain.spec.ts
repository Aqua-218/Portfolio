import { expect, test, type Page } from "@playwright/test";

const curtain = (page: Page) =>
  page
    .locator('div[aria-hidden="true"]')
    .filter({ has: page.locator("span") })
    .last();

/** ハイドレーションが済むまで待つ。ロゴの猫が描かれていれば済んでいる。 */
async function open(page: Page) {
  await page.goto("/");
  await expect(page.locator("header svg.px-svg")).toBeAttached();
}

/** 幕が動き終わって、画面の外にいるか。 */
async function idle(page: Page): Promise<boolean> {
  return curtain(page).evaluate((el) => {
    const { right } = el.getBoundingClientRect();
    return el.getAnimations().length === 0 && right <= 0;
  });
}

/** 幕が画面を覆っているか。 */
async function covering(page: Page): Promise<boolean> {
  return curtain(page).evaluate((el) => {
    const { left, right } = el.getBoundingClientRect();
    return left < 1 && right > window.innerWidth - 1;
  });
}

test("リンクを押すと幕が閉じてから開く", async ({ page }) => {
  await open(page);
  await page
    .getByRole("navigation", { name: "ページ" })
    .getByRole("link", { name: "About" })
    .click();

  // 幕が閉じきるまでは、まだ前のページにいる
  await expect(page).toHaveURL("/");
  await expect.poll(() => covering(page)).toBe(true);
  await expect(curtain(page)).toHaveText("About");

  // 幕の裏でページが変わり、そのあと幕が開く
  await expect(page).toHaveURL("/about/");
  expect(await covering(page)).toBe(true);
  await expect.poll(() => idle(page), { timeout: 5000 }).toBe(true);
});

test("戻るボタンでも幕が閉じてから開く", async ({ page }) => {
  await open(page);
  await page
    .getByRole("navigation", { name: "ページ" })
    .getByRole("link", { name: "About" })
    .click();
  await expect(page).toHaveURL("/about/");
  // 幕が動いている間は、次の移動に幕を出さない(モックと同じ)ので、動き終わるまで待つ
  await expect.poll(() => idle(page), { timeout: 5000 }).toBe(true);

  // page.goBack()は移り終わるまで待ってしまうので、history.back()を呼ぶ
  await page.evaluate(() => {
    history.back();
  });
  // 幕が閉じきるまでは、前のページ(About)の中身のまま
  await expect(curtain(page)).toHaveText("Home");
  await expect(page.getByRole("heading", { name: "小峯 圭也" })).toBeHidden();
  await expect.poll(() => covering(page)).toBe(true);
  await expect(page.getByRole("heading", { name: "小峯 圭也" })).toBeVisible();
  expect(await covering(page)).toBe(true);
  await expect.poll(() => idle(page), { timeout: 5000 }).toBe(true);
});

test("動きを減らす設定では幕を出さない", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await page
    .getByRole("navigation", { name: "ページ" })
    .getByRole("link", { name: "About" })
    .click();
  await expect(page).toHaveURL("/about/");
  expect(await covering(page)).toBe(false);
});

test("幕が閉じている間に黒猫が2.4秒で横切る", async ({ page }) => {
  await open(page);
  const runner = page.locator("body > span[aria-hidden='true']").last();
  await expect(runner).toBeHidden();

  const start = Date.now();
  await page
    .getByRole("navigation", { name: "ページ" })
    .getByRole("link", { name: "About" })
    .click();
  await expect(runner).toBeVisible();
  // 黒猫がWasmで描かれている
  await expect(runner.locator("svg.px-svg")).toBeAttached();

  // 左から右へ進む
  const x1 = (await runner.boundingBox())?.x ?? 0;
  await page.waitForTimeout(600);
  const x2 = (await runner.boundingBox())?.x ?? 0;
  expect(x2).toBeGreaterThan(x1);

  // 横切ったら消える
  await expect(runner).toBeHidden({ timeout: 4000 });
  const elapsed = Date.now() - start;
  expect(elapsed).toBeGreaterThan(2000);
  expect(elapsed).toBeLessThan(3500);
});
