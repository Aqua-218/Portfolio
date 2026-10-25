import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { type Fetcher, OgpCache, parseOgp, render } from "./index";

const SIMPLE: Fetcher = (url) =>
  Promise.resolve(
    url.includes("simpleicons")
      ? {
          title: "Simple Icons",
          description: "Free SVG icons for popular brands",
        }
      : undefined,
  );

function cacheFile(): string {
  return path.join(mkdtempSync(path.join(tmpdir(), "ogp-")), "ogp.json");
}

describe("parseOgp", () => {
  it("og:のメタを読み、画像は絶対URLにする", () => {
    const html =
      '<head><title>t</title><meta property="og:title" content="猫"><meta property="og:description" content="にゃー"><meta property="og:image" content="/cat.png"></head>';
    expect(parseOgp(html, "https://example.com/a/")).toEqual({
      title: "猫",
      description: "にゃー",
      image: "https://example.com/cat.png",
    });
  });

  it("og:がなければtitleとdescriptionを使う", () => {
    const html =
      '<head><title>ねこ</title><meta name="description" content="説明"></head>';
    expect(parseOgp(html, "https://example.com/")).toEqual({
      title: "ねこ",
      description: "説明",
    });
  });
});

describe("リンクカード", () => {
  it("URLだけの行をカードにする", async () => {
    const ogp = new OgpCache(cacheFile(), SIMPLE);
    const html = await render("https://simpleicons.org/", { ogp });
    expect(html).toBe(
      '<a class="lcard" href="https://simpleicons.org/" target="_blank" rel="noopener"><span class="lc-t">Simple Icons</span><span class="lc-d">Free SVG icons for popular brands</span><span class="lc-u">simpleicons.org</span></a>',
    );
  });

  it("文の中のURLはふつうのリンクのまま", async () => {
    const ogp = new OgpCache(cacheFile(), SIMPLE);
    const html = await render("見て https://simpleicons.org/ これ", { ogp });
    expect(html).not.toContain("lcard");
  });

  it("OGPが取れなければ、ホスト名だけのカード", async () => {
    const ogp = new OgpCache(cacheFile(), SIMPLE);
    const html = await render("https://example.com/nai", { ogp });
    expect(html).toContain('<span class="lc-t">example.com</span>');
    expect(html).not.toContain("lc-d");
  });

  it("取ったOGPはファイルに保存し、次は取りに行かない", async () => {
    const file = cacheFile();
    let calls = 0;
    const counting: Fetcher = (url) => {
      calls += 1;
      return SIMPLE(url);
    };
    await render("https://simpleicons.org/", {
      ogp: new OgpCache(file, counting),
    });
    expect(JSON.parse(readFileSync(file, "utf8"))).toHaveProperty([
      "https://simpleicons.org/",
    ]);
    await render("https://simpleicons.org/", {
      ogp: new OgpCache(file, counting),
    });
    expect(calls).toBe(1);
  });

  it("べつのプロセスが保存したものを消さずに、合わせて保存する", async () => {
    const file = cacheFile();
    const fetcher: Fetcher = (url) =>
      Promise.resolve({ title: url, description: "" });
    // 2つのプロセスが、それぞれ空のキャッシュから読み始めたとき
    const a = new OgpCache(file, fetcher);
    const b = new OgpCache(file, fetcher);
    await a.get("https://a.example/");
    await b.get("https://b.example/");
    const saved = JSON.parse(readFileSync(file, "utf8")) as Record<
      string,
      unknown
    >;
    expect(Object.keys(saved)).toEqual([
      "https://a.example/",
      "https://b.example/",
    ]);
  });

  it("usedを渡すと、使ったURLを書き足す。キャッシュにあっても書く", async () => {
    const file = cacheFile();
    const used = path.join(path.dirname(file), ".used");
    const ogp = new OgpCache(file, SIMPLE, used);
    await ogp.get("https://simpleicons.org/");
    await ogp.get("https://simpleicons.org/");
    expect(readFileSync(used, "utf8")).toBe(
      "ogp https://simpleicons.org/\nogp https://simpleicons.org/\n",
    );
  });

  it("画像があれば、リファラーなしで読む画像をつける", async () => {
    const ogp = new OgpCache(cacheFile(), () =>
      Promise.resolve({
        title: "猫",
        description: "",
        image: "https://example.com/cat.png",
      }),
    );
    const html = await render("https://example.com/", { ogp });
    expect(html).toContain('class="lcard lcard-img"');
    expect(html).toContain(
      '<img class="lc-img" src="https://example.com/cat.png" alt="" loading="lazy" referrerpolicy="no-referrer">',
    );
  });

  it("キャッシュを渡さなければカードにしない", async () => {
    expect(await render("https://simpleicons.org/")).not.toContain("lcard");
  });
});
