import type { Element } from "hast";
import { fromHtml } from "hast-util-from-html";
import { toText } from "hast-util-to-text";
import { visit } from "unist-util-visit";

/** 目次の1行 */
export interface TocItem {
  id: string;
  text: string;
  /** 見出しの大きさ(1〜3) */
  level: 1 | 2 | 3;
}

/** HTMLから見出し(h1〜h3、idのあるもの)を拾って目次にする。文字はHTMLとして読んで取り出す */
export function toc(html: string): TocItem[] {
  const items: TocItem[] = [];
  visit(fromHtml(html, { fragment: true }), "element", (node: Element) => {
    const level = { h1: 1, h2: 2, h3: 3 }[node.tagName];
    const id = node.properties.id;
    if (level === undefined || typeof id !== "string") return;
    items.push({ id, level: level as 1 | 2 | 3, text: toText(node).trim() });
  });
  return items;
}
