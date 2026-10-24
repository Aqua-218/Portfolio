import { renderSync } from "@portfolio/pxcat/node";
import type { Coat, FrameName } from "@portfolio/pxcat";
import type { Element, ElementContent, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";

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

/** ドット猫のSVG。ビルド時に描いて埋め込む */
function cat(kind: Kind): ElementContent[] {
  const { frame, coat } = CATS[kind];
  const svg = renderSync([frame], coat, 2);
  return fromHtml(svg, { fragment: true, space: "svg" })
    .children as ElementContent[];
}

/**
 * GitHubのアラート(`> [!NOTE]`など)を、猫のついた注意書きにする。
 * `<div class="callout callout-note">猫<div><b>NOTE</b>本文</div></div>`
 */
export function rehypeAlerts() {
  return (tree: Root) => {
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
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["callout", `callout-${kind.toLowerCase()}`] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["callout-cat"], ariaHidden: "true" },
            children: cat(kind),
          },
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
  };
}
