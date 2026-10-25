import path from "node:path";
import { OgpCache, render } from "@portfolio/markdown";

/** リンクカードのOGP。content/.cache/ogp.jsonに保存してコミットし、次のビルドでは取りに行かない */
const ogp = new OgpCache(
  path.join(process.cwd(), "../../content/.cache/ogp.json"),
);

/** content/のMarkdownをHTMLにする */
export function markdown(source: string): Promise<string> {
  return render(source, { ogp });
}
