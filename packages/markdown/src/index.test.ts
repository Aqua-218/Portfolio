import { describe, expect, it } from "vitest";
import { render } from "./index";

describe("render", () => {
  it("空行で分けた文を段落にする", async () => {
    expect(await render("いち\n\nに")).toBe("<p>いち</p>\n<p>に</p>");
  });

  it("見出しにアンカーをつける", async () => {
    expect(await render("## 猫の話")).toBe(
      '<h2 id="猫の話"><a href="#猫の話">猫の話</a></h2>',
    );
  });

  it("GFMの表と打ち消し線を使える", async () => {
    const html = await render("| a |\n| - |\n| b |\n\n~~消す~~");
    expect(html).toContain("<table>");
    expect(html).toContain("<del>消す</del>");
  });

  it("生のHTMLは通さない", async () => {
    expect(await render('<script>alert("にゃ")</script>')).not.toContain(
      "<script>",
    );
  });
});

describe("コードの色", () => {
  it.each([
    ["rust", "fn main() {}"],
    ["typescript", "const x: number = 1;"],
    ["lean4", "theorem t : 1 = 1 := rfl"],
    ["tla", "Init == x = 0 \\* はじめ"],
  ])("%sに猫のテーマで色がつく", async (lang, code) => {
    const html = await render("```" + lang + "\n" + code + "\n```");
    expect(html).toContain('class="shiki cat"');
    expect(html).toContain("var(--shiki-token-");
  });

  it("知らない言語は色なしで出す", async () => {
    const html = await render("```nyan\nにゃー\n```");
    expect(html).toContain("にゃー");
    expect(html).not.toContain("var(--shiki-token-");
  });
});

describe("数式", () => {
  it("$...$を文中の数式にする", async () => {
    const html = await render("輪郭は $x + 1$ マス");
    expect(html).toContain("<math");
    expect(html).not.toContain('display="block"');
  });

  it("$$...$$を独立した数式にする", async () => {
    const html = await render("$$\n\\forall c \\in \\mathrm{Cats}\n$$");
    expect(html).toContain('display="block"');
    expect(html).toContain("∀");
  });

  it("KaTeXのCSSのためのHTMLは出さない", async () => {
    expect(await render("$x$")).not.toContain("katex-html");
  });
});
