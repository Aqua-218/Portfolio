import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Element, ElementContent, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

declare module "vfile" {
  interface DataMap {
    /** 描いたMermaidの図のキャッシュ */
    mermaidCache: MermaidCache;
  }
}

/**
 * 描くときにテーマへ入れる仮の色と、置き換える先のCSS変数。
 * 図はサイトのテーマの色で出したいので、ありえない色で描いておき、あとで変数に置き換える。
 */
const COLORS = {
  "#010203": "var(--ink)",
  "#020304": "var(--paper)",
  "#030405": "var(--muted)",
  "#040506": "var(--line)",
  "#050607": "var(--tatami)",
  "#060708": "var(--mike)",
  "#070809": "var(--mm-note)",
} as const;

const [INK, PAPER, MUTED, LINE, TATAMI, MIKE, NOTE] = Object.keys(COLORS);

/** Mermaidのテーマ。モックの図と同じ割り当て */
const themeVariables = {
  fontFamily: "LINE Seed JP",
  fontSize: "14px",
  background: PAPER,
  primaryColor: TATAMI,
  primaryTextColor: INK,
  primaryBorderColor: MUTED,
  secondaryColor: PAPER,
  tertiaryColor: PAPER,
  lineColor: MUTED,
  textColor: INK,
  mainBkg: TATAMI,
  nodeBorder: MUTED,
  clusterBkg: PAPER,
  clusterBorder: LINE,
  edgeLabelBackground: PAPER,
  actorBkg: TATAMI,
  actorBorder: MUTED,
  actorTextColor: INK,
  actorLineColor: MUTED,
  signalColor: INK,
  signalTextColor: INK,
  labelBoxBkgColor: TATAMI,
  labelBoxBorderColor: MUTED,
  labelTextColor: INK,
  loopTextColor: INK,
  noteBkgColor: NOTE,
  noteBorderColor: MIKE,
  noteTextColor: INK,
  activationBkgColor: TATAMI,
  activationBorderColor: MUTED,
  sequenceNumberColor: PAPER,
};

/** 16進の色の、赤・緑・青 */
function channels(hex: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) =>
    Number.parseInt(hex.slice(i, i + 2), 16),
  );
  return [r, g, b];
}

/** rgb()やrgba()で書いた色にあたる正規表現。aは透明度を取り出す */
function rgbPattern([r, g, b]: [number, number, number]): RegExp {
  return new RegExp(
    `rgba?\\(\\s*${String(r)}\\s*,\\s*${String(g)}\\s*,\\s*${String(b)}\\s*(?:,\\s*([\\d.]+)\\s*)?\\)`,
    "gi",
  );
}

/**
 * 仮の色をCSS変数に置き換える。
 * Mermaidが仮の色から作った色も置き換える。半透明にしたものはcolor-mixで、
 * 背景(paper)を反転したもの(文字の色に使う)と黒は、文字の色(ink)にする。
 */
export function toVars(svg: string): string {
  let out = svg;
  for (const [hex, css] of Object.entries(COLORS)) {
    out = out
      .replace(new RegExp(hex, "gi"), css)
      .replace(rgbPattern(channels(hex)), (_, a?: string) =>
        a === undefined || Number(a) >= 1
          ? css
          : `color-mix(in srgb, ${css} ${String(Math.round(Number(a) * 100))}%, transparent)`,
      );
  }
  const [r, g, b] = channels(PAPER ?? "#000000");
  const inverted = `#${[255 - r, 255 - g, 255 - b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  return out
    .replace(new RegExp(inverted, "gi"), "var(--ink)")
    .replace(/#000000\b|#000\b/gi, "var(--ink)");
}

/** 図を描く。ChromiumでMermaidを動かしてSVGにする */
export type Drawer = (source: string, id: string) => Promise<string>;

/** Playwrightのheadless ChromiumでMermaidを動かす */
export const drawWithChromium: Drawer = async (source, id) => {
  const { chromium } = await import("playwright-core");
  // require.resolveやnew URL(…, import.meta.url)はバンドラーが書き換えてしまうので、パスを組み立てる
  const script = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../node_modules/mermaid/dist/mermaid.min.js",
  );
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent("<!doctype html><body></body>");
    await page.addScriptTag({ path: script });
    return await page.evaluate(
      async ({ source, id, themeVariables }) => {
        const mermaid = (
          globalThis as unknown as {
            mermaid: {
              initialize: (c: object) => void;
              render: (id: string, s: string) => Promise<{ svg: string }>;
            };
          }
        ).mermaid;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          look: "classic",
          themeVariables,
          // clickでリンクを張れるようにする。スクリプトは取り除く
          securityLevel: "antiscript",
        });
        return (await mermaid.render(id, source)).svg;
      },
      { source, id, themeVariables },
    );
  } finally {
    await browser.close();
  }
};

/**
 * 描いた図のキャッシュ。図の中身のハッシュをファイル名にして、SVGを保存する。
 * 保存したものはコミットするので、CIのビルドではChromiumがなくても図が出る。
 */
export class MermaidCache {
  constructor(
    private readonly dir: string,
    private readonly drawer: Drawer = drawWithChromium,
  ) {}

  async get(source: string): Promise<string> {
    const hash = createHash("sha256").update(source).digest("hex").slice(0, 16);
    const file = path.join(this.dir, `${hash}.svg`);
    try {
      return readFileSync(file, "utf8");
    } catch {
      const svg = toVars(await this.drawer(source, `mmd-${hash}`));
      mkdirSync(this.dir, { recursive: true });
      writeFileSync(file, svg);
      return svg;
    }
  }
}

/** コードの文字を全部つなげる */
function textOf(node: Element): string {
  return node.children
    .map((c) =>
      c.type === "text" ? c.value : c.type === "element" ? textOf(c) : "",
    )
    .join("");
}

/** ```mermaidのコードを、描いたSVGの図にする。キャッシュはfile.data.mermaidCache */
export function rehypeMermaid() {
  return async (tree: Root, file: VFile) => {
    const cache = file.data.mermaidCache;
    if (!cache) return;
    const found: { node: Element; source: string }[] = [];
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "pre") return;
      const code = node.children[0];
      if (code?.type !== "element" || code.tagName !== "code") return;
      const cls = code.properties.className;
      if (!Array.isArray(cls) || !cls.includes("language-mermaid")) return;
      found.push({ node, source: textOf(code).trim() });
    });
    for (const { node, source } of found) {
      const svg = await cache.get(source);
      node.tagName = "figure";
      node.properties = { className: ["mmd"] };
      node.children = fromHtml(svg, { fragment: true, space: "svg" })
        .children as ElementContent[];
    }
  };
}
