import type { Element, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

/** リンクカードに出すもの */
export interface Ogp {
  title: string;
  description: string;
  image?: string;
}

/** URLからOGPを取る。取れなければundefined */
export type Fetcher = (url: string) => Promise<Ogp | undefined>;

/** ページのHTMLから、OGP(なければtitleとdescription)を読む */
export function parseOgp(html: string, base: string): Ogp | undefined {
  const tree = fromHtml(html);
  const meta = new Map<string, string>();
  let title = "";
  visit(tree, "element", (node: Element) => {
    if (node.tagName === "title" && title === "") {
      const text = node.children[0];
      if (text?.type === "text") title = text.value.trim();
    }
    if (node.tagName !== "meta") return;
    const key = String(node.properties.property ?? node.properties.name ?? "");
    const content = node.properties.content;
    if (key !== "" && typeof content === "string" && !meta.has(key))
      meta.set(key, content.trim());
  });
  const ogTitle = meta.get("og:title") ?? title;
  if (ogTitle === "") return undefined;
  const image = meta.get("og:image");
  return {
    title: ogTitle,
    description: meta.get("og:description") ?? meta.get("description") ?? "",
    ...(image ? { image: new URL(image, base).href } : {}),
  };
}

/** URLからOGPを返すもの。ビルドではキャッシュ(OgpCache)、ブラウザでは何も返さない */
export interface OgpSource {
  get(url: string): Promise<Ogp | undefined>;
}

declare module "vfile" {
  interface DataMap {
    /** リンクカードのOGP */
    ogp: OgpSource;
  }
}

/** 段落にURLのリンクだけがあれば、そのURL */
function bareUrl(node: Element): string | undefined {
  if (node.tagName !== "p" || node.children.length !== 1) return undefined;
  const a = node.children[0];
  if (a?.type !== "element" || a.tagName !== "a") return undefined;
  const href = a.properties.href;
  const text = a.children[0];
  if (typeof href !== "string" || text?.type !== "text") return undefined;
  if (text.value !== href || !/^https?:\/\//.test(href)) return undefined;
  return href;
}

function span(className: string, value: string): Element {
  return {
    type: "element",
    tagName: "span",
    properties: { className: [className] },
    children: [{ type: "text", value }],
  };
}

/** 1行にURLだけを書いた段落を、リンクカードにする。OGPはfile.data.ogpのキャッシュから取る */
export function rehypeLinkCards() {
  return async (tree: Root, file: VFile) => {
    const cache = file.data.ogp;
    if (!cache) return;
    const found: { node: Element; url: string }[] = [];
    visit(tree, "element", (node: Element) => {
      const url = bareUrl(node);
      if (url) found.push({ node, url });
    });
    for (const { node, url } of found) {
      const ogp = await cache.get(url);
      const host = new URL(url).host;
      node.tagName = "a";
      node.properties = {
        className: ogp?.image ? ["lcard", "lcard-img"] : ["lcard"],
        href: url,
        target: "_blank",
        rel: ["noopener"],
      };
      node.children = [
        span("lc-t", ogp?.title ?? host),
        ...(ogp?.description ? [span("lc-d", ogp.description)] : []),
        span("lc-u", host),
        // 画像は相手のサイトにこのページを知らせないよう、リファラーなしで読む。
        // 読めなかったときは、サイトの側で画像を外して画像なしのカードにする
        ...(ogp?.image
          ? [
              {
                type: "element" as const,
                tagName: "img",
                properties: {
                  className: ["lc-img"],
                  src: ogp.image,
                  alt: "",
                  loading: "lazy",
                  referrerPolicy: "no-referrer",
                },
                children: [],
              },
            ]
          : []),
      ];
    }
  };
}
