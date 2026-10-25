import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { type Drawer, MermaidCache, render, toVars } from "./index";

describe("toVars", () => {
  it("仮の色をCSS変数にする", () => {
    expect(toVars('<rect fill="#010203" stroke="#030405"/>')).toBe(
      '<rect fill="var(--ink)" stroke="var(--muted)"/>',
    );
  });

  it("rgb()やrgba()で書かれた仮の色も置き換え、半透明はcolor-mixにする", () => {
    expect(toVars("fill:rgb(5, 6, 7);background:rgba(2, 3, 4, 0.5)")).toBe(
      "fill:var(--tatami);background:color-mix(in srgb, var(--paper) 50%, transparent)",
    );
  });

  it("背景を反転した色と黒は、文字の色にする", () => {
    expect(toVars("color:#fdfcfb;fill:#000000;stroke:#000")).toBe(
      "color:var(--ink);fill:var(--ink);stroke:var(--ink)",
    );
  });
});

describe("Mermaid", () => {
  const svg: Drawer = (source, id) =>
    Promise.resolve(
      `<svg id="${id}"><rect fill="#050607"/><text>${String(source.length)}</text></svg>`,
    );

  it("mermaidのコードを図にする", async () => {
    const mermaid = new MermaidCache(
      mkdtempSync(path.join(tmpdir(), "mm-")),
      svg,
    );
    const html = await render("```mermaid\nflowchart LR\n  A --> B\n```", {
      mermaid,
    });
    expect(html).toMatch(/^<figure class="mmd"><svg id="mmd-[0-9a-f]{16}">/);
    expect(html).toContain('fill="var(--tatami)"');
  });

  it("同じ図は描き直さず、ファイルから読む", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "mm-"));
    let calls = 0;
    const counting: Drawer = (source, id) => {
      calls += 1;
      return svg(source, id);
    };
    const md = "```mermaid\nflowchart LR\n  A --> B\n```";
    await render(md, { mermaid: new MermaidCache(dir, counting) });
    await render(md, { mermaid: new MermaidCache(dir, counting) });
    expect(calls).toBe(1);
    expect(readdirSync(dir)).toHaveLength(1);
  });

  it("キャッシュを渡さなければコードのまま", async () => {
    expect(await render("```mermaid\nflowchart LR\n```")).toContain("<pre");
  });
});
