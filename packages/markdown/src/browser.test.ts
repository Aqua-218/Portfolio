import { describe, expect, it, vi } from "vitest";
import { renderPreview } from "./browser";

// ブラウザではWasmのドット猫で描く。テストでは描いたことだけ分かればいい
vi.mock("@portfolio/pxcat", () => ({
  render: (frames: string[], coat: string) =>
    Promise.resolve(
      `<svg class="px-svg" data-cat="${frames.join()}-${coat}"></svg>`,
    ),
}));

describe("renderPreview", () => {
  it("アラートの猫を描く", async () => {
    const html = await renderPreview("> [!NOTE]\n> 猫は液体です。");
    expect(html).toContain('data-cat="peek-mike"');
    expect(html).toContain("<b>NOTE</b>");
  });

  it("リンクカードはOGPを取りに行かず、ホスト名だけ", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const html = await renderPreview("https://simpleicons.org/");
    expect(html).toContain('<span class="lc-t">simpleicons.org</span>');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("Mermaidは描かず、保存したあとに描くと出す", async () => {
    const html = await renderPreview(
      "```mermaid\nflowchart LR\n  A --> B\n```",
    );
    expect(html).toContain('<figure class="mmd">');
    expect(html).toContain("図は保存したあとに描きます");
  });

  it("コードと数式は本番と同じ", async () => {
    const html = await renderPreview("```rust\nfn main() {}\n```\n\n$x$");
    expect(html).toContain('class="shiki cat"');
    expect(html).toContain("<math");
  });
});
