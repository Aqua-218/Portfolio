import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** サイトに出す記事(限定公開のものは除く) */
function posts(): { slug: string; title: string }[] {
  const site = JSON.parse(
    readFileSync(new URL("../.content/site.json", import.meta.url), "utf8"),
  ) as { blog: { slug: string; title: string; private: boolean }[] };
  return site.blog.filter((p) => !p.private);
}

test.beforeEach(async ({ page }) => {
  // 埋め込みの中身(外のサイト)は読まない
  await page.route(
    (url) => url.hostname !== "localhost",
    (route) => route.abort(),
  );
});

test("一覧に記事が並ぶ。なければ、まだないと出す", async ({ page }) => {
  await page.goto("/blog/");
  await expect(
    page
      .getByRole("navigation", { name: "ページ" })
      .getByRole("link", { name: "Blog" }),
  ).toHaveAttribute("aria-current", "page");
  const list = posts();
  if (list.length === 0) {
    await expect(page.getByText("まだ記事はありません。")).toBeVisible();
  } else {
    for (const p of list)
      await expect(page.getByRole("link", { name: p.title })).toHaveAttribute(
        "href",
        `/blog/${p.slug}/`,
      );
  }
  // 記法の見本は一覧に出さない
  await expect(page.getByRole("link", { name: "記法の見本" })).toHaveCount(0);
});

test("タグで絞り込む", async ({ page }) => {
  await page.goto("/blog/?tag=Qiita");
  await expect(page.getByText("「Qiita」の記事")).toBeVisible();
});

test.describe("記事(記法の見本)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/blog/sample/");
  });

  test("検索に載せない", async ({ page }) => {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("目次から見出しへ行ける", async ({ page }) => {
    const toc = page.getByRole("navigation", { name: "目次" });
    for (const name of ["見出し1", "見出し2", "見出し3"]) {
      const href = await toc.getByRole("link", { name }).getAttribute("href");
      expect(href).toMatch(/^#/);
      await expect(
        page.locator(`[id="${decodeURIComponent(href?.slice(1) ?? "")}"]`),
      ).toHaveText(name);
    }
  });

  test("Qiitaの記法が、サイトの見た目で出る", async ({ page }) => {
    const body = page.locator("article");
    // 注意書き(猫つき)
    await expect(body.locator(".callout")).toHaveCount(3);
    await expect(body.locator(".callout svg.px-svg")).toHaveCount(3);
    // コードのファイル名と、差分の行
    await expect(body.locator("figcaption.code-lang")).toHaveText("app.rb");
    await expect(body.locator(".line.diff-add")).toHaveCount(1);
    await expect(body.locator(".line.diff-del")).toHaveCount(1);
    // 数式・絵文字・メンション・色の見本
    await expect(body.locator("math").first()).toBeAttached();
    await expect(body.locator(".emoji")).toHaveCount(2);
    await expect(body.getByRole("link", { name: "@Qiita" })).toHaveAttribute(
      "href",
      "https://qiita.com/Qiita",
    );
    await expect(body.locator(".inline-code-color")).toHaveCount(1);
  });

  test("埋め込みはsandboxつきのiframeで、外のスクリプトは読まない", async ({
    page,
  }) => {
    const frames = page.locator("article .embed iframe");
    await expect(frames).toHaveCount(2);
    for (const f of await frames.all())
      await expect(f).toHaveAttribute("sandbox", /allow-scripts/);
    await expect(page.locator('script[src*="twitter"]')).toHaveCount(0);
  });
});
