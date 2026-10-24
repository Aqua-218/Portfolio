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
