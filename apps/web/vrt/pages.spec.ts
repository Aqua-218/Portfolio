import { expect, test } from "@playwright/test";
import { ERRORS } from "../src/lib/errors";

// 中身ができたページから足していく
const PAGES = [
  { name: "home", path: "/" },
  { name: "about", path: "/about/" },
  { name: "skills", path: "/skills/" },
  { name: "work", path: "/work/" },
  { name: "affiliations", path: "/affiliations/" },
  { name: "events", path: "/events/" },
  { name: "event", path: "/events/2026-08-10-seccamp/" },
  { name: "shelf", path: "/shelf/" },
  { name: "stack", path: "/stack/" },
  { name: "license", path: "/license/" },
  { name: "cats", path: "/cats/" },
  { name: "404", path: "/nai/" },
  { name: "markdown", path: "/markdown/" },
  { name: "blog", path: "/blog/" },
  // ブログの記事の見た目は、記法の見本で見る
  { name: "post", path: "/blog/sample/" },
  ...Object.keys(ERRORS).map((code) => ({
    name: code,
    path: `/errors/${code}/`,
  })),
];

for (const { name, path } of PAGES) {
  test(name, async ({ page }) => {
    // Homeの時計が毎回同じ時刻を出すよう、時計を止めておく
    await page.clock.setFixedTime(new Date("2026-10-24T12:34:56+09:00"));
    // 外のサイト(埋め込みのYouTube・X・CodePenなど)は読まない。読むと、撮るたびに中身や高さが揺れる。
    // 埋め込みの枠は塗りつぶして撮る
    await page.route(
      (url) => url.hostname !== "localhost" && url.hostname !== "127.0.0.1",
      (route) => route.abort(),
    );
    await page.goto(path);
    // フォントとドット猫が出そろってから撮る
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("header svg.px-svg")).toBeAttached();
    // 画面の外の写真も先に読ませる。遅延読み込みのままだと、撮るときのスクロールで読み込みが揺れる
    await page.evaluate(() => {
      for (const im of document.querySelectorAll<HTMLImageElement>(
        'img[loading="lazy"]',
      )) {
        im.loading = "eager";
      }
    });
    // 写真が全部読めてから撮る
    await page.waitForFunction(() =>
      [...document.images].every((im) => im.complete && im.naturalWidth > 0),
    );
    await page.evaluate(() =>
      Promise.all([...document.images].map((im) => im.decode())),
    );
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      mask: [page.locator(".embed")],
    });
  });
}
