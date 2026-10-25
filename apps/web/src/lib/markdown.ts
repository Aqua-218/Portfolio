import path from "node:path";
import {
  drawWithChromium,
  fetchOgp,
  MermaidCache,
  OgpCache,
  render,
} from "@portfolio/markdown";

const cache = path.join(process.cwd(), "../../content/.cache");
/** 使った図とOGPを書き足していくファイル。ビルドのあと、使わなくなったものを消すのに使う(scripts/cache.mjs) */
const used = path.join(cache, ".used");

/** リンクカードのOGP。content/.cache/ogp.jsonに保存してコミットし、次のビルドでは取りに行かない */
const ogp = new OgpCache(path.join(cache, "ogp.json"), fetchOgp, used);

/**
 * 描いたMermaidの図。content/.cache/mermaid/に保存してコミットする。
 * 管理画面から足したものは、PRでActionsが描いてコミットする(.github/workflows/content-cache.yml)
 */
const mermaid = new MermaidCache(
  path.join(cache, "mermaid"),
  drawWithChromium,
  used,
);

/** content/のMarkdownをHTMLにする */
export function markdown(source: string): Promise<string> {
  return render(source, { ogp, mermaid });
}
