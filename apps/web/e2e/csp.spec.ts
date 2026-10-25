import { expect, test } from "@playwright/test";

/** CSPの下で、ページが壊れずに動くか見るページ */
const PAGES = [
  "/",
  "/about/",
  "/skills/",
  "/work/",
  "/affiliations/",
  "/events/",
  "/events/2026-08-10-seccamp/",
  "/shelf/",
  "/stack/",
  "/cats/",
  "/license/",
  "/markdown/",
  "/blog/",
  // 埋め込み(YouTube・X)のある記事
  "/blog/sample/",
  "/errors/500/",
  "/nai/",
];

for (const path of PAGES) {
  test(`${path} はCSPと守りのヘッダーつきで、違反なく動く`, async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("console", (m) => {
      if (/Content Security Policy|Refused to/.test(m.text()))
        problems.push(m.text());
    });
    page.on("pageerror", (e) => {
      problems.push(e.message);
    });
    // 外のサイト(埋め込み・リンクカードの画像)は読まない。CSPで止められるなら、読みに行く前に違反が出る
    await page.route(
      (url) => url.hostname !== "localhost",
      (route) => route.abort(),
    );
    const res = await page.goto(path);
    const h = res?.headers() ?? {};
    expect(h["content-security-policy"]).toMatch(
      /^default-src 'none'; script-src 'self' 'wasm-unsafe-eval' 'sha256-/,
    );
    expect(h["x-frame-options"]).toBe("DENY");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBe("no-referrer");
    expect(h["cross-origin-opener-policy"]).toBe("same-origin");
    // ハイドレーションして、ロゴのドット猫(Wasm)が描ける
    await expect(page.locator("header svg.px-svg")).toBeAttached();
    expect(problems).toEqual([]);
  });
}

test("CSPは、ページにないインラインのスクリプトを動かさない", async ({
  page,
}) => {
  await page.goto("/");
  const ran = await page.evaluate(() => {
    const w = window as unknown as { injected?: boolean };
    const s = document.createElement("script");
    s.textContent = "window.injected = true";
    document.body.append(s);
    return w.injected === true;
  });
  expect(ran).toBe(false);
});

test("ページの中で移っても(最初のページのCSPのまま)、移った先の図が違反なく出る", async ({
  page,
}) => {
  const problems: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/.test(m.text()))
      problems.push(m.text());
  });
  await page.goto("/");
  await expect(page.locator("header svg.px-svg")).toBeAttached();
  await page
    .getByRole("navigation", { name: "ページ" })
    .getByRole("link", { name: "Stack" })
    .click();
  await expect(page).toHaveURL("/stack/", { timeout: 5000 });
  await expect(page.locator("main figure svg").first()).toBeVisible();
  expect(problems).toEqual([]);
});
