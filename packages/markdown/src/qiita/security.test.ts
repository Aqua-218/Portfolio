import { describe, expect, it } from "vitest";
import { render } from "../index";

const qiita = (md: string) => render(md, { flavor: "qiita" });

describe("Qiitaの記法の守り", () => {
  it.each([
    ["script", "<script>alert(1)</script>"],
    [
      "イベントの属性",
      '<img src="https://example.com/a.png" onerror="alert(1)">',
    ],
    ["javascript:", '<a href="javascript:alert(1)">x</a>'],
    [
      "data:のリンク",
      '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    ],
    ["svg", '<svg onload="alert(1)"><circle/></svg>'],
    ["style", "<style>body{display:none}</style>"],
    ["iframe", '<iframe src="https://evil.example/"></iframe>'],
    ["object", '<object data="https://evil.example/x.swf"></object>'],
    ["form", '<form action="https://evil.example/"><input name="p"></form>'],
    ["base", '<base href="https://evil.example/">'],
    [
      "meta",
      '<meta http-equiv="refresh" content="0;url=https://evil.example/">',
    ],
    ["Markdownのリンク", "[x](javascript:alert(1))"],
    ["Markdownの画像", "![x](javascript:alert(1))"],
  ])("%s は残さない", async (_name, md) => {
    const html = await qiita(md);
    expect(html).not.toMatch(
      /<script|onerror|onload|javascript:|<svg|<style|<iframe|<object|<form|<base|<meta|data:text/i,
    );
  });

  it("styleは表のセルのtext-alignとborderだけ", async () => {
    const html = await qiita(
      '<table><tr><td style="text-align: center; background: url(https://evil.example/)">a</td></tr></table>\n\n<div style="position: fixed">b</div>',
    );
    expect(html).toContain('style="text-align: center"');
    expect(html).not.toContain("evil.example");
    expect(html).not.toContain("position");
  });

  it("idは記事の中のものだけで、ページのほかの部分のidを奪わない書き方でも壊れない", async () => {
    const html = await qiita('<h2 id="__next">見出し</h2>');
    // 見出しのidは、Qiitaと同じく中身から作り直す
    expect(html).toContain('id="見出し"');
    expect(html).not.toContain('id="__next"');
  });
});
