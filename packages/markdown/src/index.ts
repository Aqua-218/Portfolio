import { renderSync } from "@portfolio/pxcat/node";
import type { MermaidCache } from "./mermaid";
import type { OgpCache } from "./ogp";
import { type Flavor, renderWith } from "./pipeline";

export type { Flavor } from "./pipeline";

export { parseOgp, type Fetcher, type Ogp } from "./cards";
export { toVars } from "./diagrams";
export { MermaidCache, drawWithChromium, type Drawer } from "./mermaid";
export { OgpCache, fetchOgp } from "./ogp";
export { toc, type TocItem } from "./toc";

export interface RenderOptions {
  /** リンクカードのOGPのキャッシュ。なければリンクカードにしない */
  ogp?: OgpCache;
  /** 描いたMermaidの図のキャッシュ。なければMermaidはコードのまま */
  mermaid?: MermaidCache;
  /** 書き方。ブログの記事はqiita(Qiitaと同じ記法) */
  flavor?: Flavor;
}

/** ビルドで、MarkdownをHTMLの文字列にする。アラートの猫はpxcatで描いて埋め込む */
export function render(
  markdown: string,
  options: RenderOptions = {},
): Promise<string> {
  return renderWith(
    markdown,
    {
      ...(options.ogp ? { ogp: options.ogp } : {}),
      ...(options.mermaid ? { mermaidCache: options.mermaid } : {}),
      cat: (frame, coat) => renderSync([frame], coat, 2),
    },
    options.flavor,
  );
}
