import path from "node:path";
import { MermaidCache, OgpCache, render } from "@portfolio/markdown";

/** リンクカードのOGP。content/.cache/ogp.jsonに保存してコミットし、次のビルドでは取りに行かない */
const ogp = new OgpCache(
  path.join(process.cwd(), "../../content/.cache/ogp.json"),
);

/**
 * 描いたMermaidの図。content/.cache/mermaid/に保存してコミットする。
 * CIのビルドにはChromiumがないので、新しい図は手元でビルドして描いておく
 */
const mermaid = new MermaidCache(
  path.join(process.cwd(), "../../content/.cache/mermaid"),
);

/** content/のMarkdownをHTMLにする */
export function markdown(source: string): Promise<string> {
  return render(source, { ogp, mermaid });
}
