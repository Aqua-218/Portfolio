import { render as drawCat } from "@portfolio/pxcat";
import { type Flavor, renderWith } from "./pipeline";

/** プレビューの図の代わり。Mermaidの図はビルドでChromiumを使って描くので、ブラウザでは描かない */
const LATER =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 40" role="img" aria-label="図は保存したあとに描きます"><text x="160" y="25" text-anchor="middle" font-size="14" fill="var(--muted)">図は保存したあとに描きます</text></svg>';

/**
 * 管理画面のプレビューで、MarkdownをHTMLの文字列にする。本番と同じ処理で、違うのは次だけ。
 * - リンクカードは、OGPを取りに行けない(ほかのサイトはブラウザから読ませてくれない)ので、ホスト名だけ
 * - Mermaidの図は描かず、「保存したあとに描きます」と出す
 * - アラートの猫は、WebAssemblyのドット猫で描く
 */
export function renderPreview(
  markdown: string,
  flavor: Flavor = "site",
): Promise<string> {
  return renderWith(
    markdown,
    {
      ogp: { get: () => Promise.resolve(undefined) },
      mermaidCache: { get: () => Promise.resolve(LATER) },
      cat: (frame, coat) => drawCat([frame], coat, 2),
    },
    flavor,
  );
}
