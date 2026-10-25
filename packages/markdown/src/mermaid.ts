import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type MermaidSource, themeVariables, toVars } from "./diagrams";

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
export class MermaidCache implements MermaidSource {
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
