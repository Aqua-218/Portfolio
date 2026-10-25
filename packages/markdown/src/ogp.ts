import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Element, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

declare module "vfile" {
  interface DataMap {
    /** リンクカードのOGPのキャッシュ */
    ogp: OgpCache;
  }
}

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

/** 本物のfetchでOGPを取る。10秒で諦める */
export const fetchOgp: Fetcher = async (url) => {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "user-agent": "Mozilla/5.0 (compatible; portfolio-linkcard)" },
    });
    if (!res.ok) return undefined;
    return parseOgp(await res.text(), res.url);
  } catch {
    return undefined;
  }
};

/**
 * OGPのキャッシュ。JSONのファイルに保存して、次のビルドでは取りに行かない。
 * 取れなかったURLは保存せず、次のビルドでもう一度取りに行く。
 */
export class OgpCache {
  private readonly entries: Record<string, Ogp>;

  constructor(
    private readonly file: string,
    private readonly fetcher: Fetcher = fetchOgp,
  ) {
    try {
      this.entries = JSON.parse(readFileSync(file, "utf8")) as Record<
        string,
        Ogp
      >;
    } catch {
      this.entries = {};
    }
  }

  async get(url: string): Promise<Ogp | undefined> {
    const hit = this.entries[url];
    if (hit) return hit;
    const ogp = await this.fetcher(url);
    if (!ogp) return undefined;
    this.entries[url] = ogp;
    this.save();
    return ogp;
  }

  private save(): void {
    mkdirSync(path.dirname(this.file), { recursive: true });
    const sorted = Object.fromEntries(
      Object.entries(this.entries).sort(([a], [b]) => a.localeCompare(b)),
    );
    writeFileSync(this.file, `${JSON.stringify(sorted, null, 2)}\n`);
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
        className: ["lcard"],
        href: url,
        target: "_blank",
        rel: ["noopener"],
      };
      node.children = [
        span("lc-t", ogp?.title ?? host),
        ...(ogp?.description ? [span("lc-d", ogp.description)] : []),
        span("lc-u", host),
      ];
    }
  };
}
