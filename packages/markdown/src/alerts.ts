import type { Coat, FrameName } from "@portfolio/pxcat";
import type { Element, ElementContent, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";
import type { VFile } from "vfile";

/** ドット猫のSVGを描く。ビルドではpxcatのrenderSync、ブラウザではWasmのrender */
export type CatDrawer = (
  frame: FrameName,
  coat: Coat,
) => string | Promise<string>;

declare module "vfile" {
  interface DataMap {
    /** アラートの猫の描き方。なければ猫なし */
    cat: CatDrawer;
  }
}

/** アラートの種類ごとの猫。NOTEはモックの見本と同じ、のぞく三毛 */
const CATS = {
  NOTE: { frame: "peek", coat: "mike" },
  TIP: { frame: "peek", coat: "kiji" },
  IMPORTANT: { frame: "peek", coat: "kuro" },
  WARNING: { frame: "tailA", coat: "mike" },
  CAUTION: { frame: "runA", coat: "kuro" },
} as const satisfies Record<string, { frame: FrameName; coat: Coat }>;

type Kind = keyof typeof CATS;

function isKind(s: string): s is Kind {
  return s in CATS;
}

/** ドット猫のSVG。描いて埋め込む */
async function cat(
  kind: Kind,
  draw: CatDrawer | undefined,
): Promise<ElementContent[]> {
  if (!draw) return [];
  const { frame, coat } = CATS[kind];
  const svg = await draw(frame, coat);
  return fromHtml(svg, { fragment: true, space: "svg" })
    .children as ElementContent[];
}

/**
 * GitHubのアラート(`> [!NOTE]`など)を、猫のついた注意書きにする。
 * `<div class="callout callout-note">猫<div><b>NOTE</b>本文</div></div>`
 */
export function rehypeAlerts() {
  return async (tree: Root, file: VFile) => {
    // 猫を描くのは非同期なので、見つけたあとでまとめて描く
    const cats: { span: Element; kind: Kind }[] = [];
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "blockquote" || !parent || index === undefined)
        return;
      const first = node.children.find(
        (c): c is Element => c.type === "element",
      );
      const text = first?.tagName === "p" ? first.children[0] : undefined;
      if (text?.type !== "text") return;
      const found = /^\[!(\w+)\]\s*/.exec(text.value);
      const kind = found?.[1]?.toUpperCase() ?? "";
      if (!found || !isKind(kind)) return;
      // 「[!NOTE]」と、そのあとの改行を本文から消す
      text.value = text.value.slice(found[0].length);
      if (text.value === "") first?.children.shift();
      // 「[!NOTE]」だけの段落だったら、段落ごと消す
      const body = node.children.filter(
        (c) => !(c === first && first.children.length === 0),
      );
      const span: Element = {
        type: "element",
        tagName: "span",
        properties: { className: ["callout-cat"], ariaHidden: "true" },
        children: [],
      };
      cats.push({ span, kind });
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["callout", `callout-${kind.toLowerCase()}`] },
        children: [
          span,
          {
            type: "element",
            tagName: "div",
            properties: {},
            children: [
              {
                type: "element",
                tagName: "b",
                properties: {},
                children: [{ type: "text", value: kind }],
              },
              ...body,
            ],
          },
        ],
      };
    });
    for (const { span, kind } of cats) {
      span.children = await cat(kind, file.data.cat);
    }
  };
}
