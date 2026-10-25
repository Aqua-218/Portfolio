import type { Element, Root } from "hast";
import type { Options as Schema } from "rehype-sanitize";
import { visit } from "unist-util-visit";

/**
 * 記事の中の生のHTMLに許すもの。qiita-markdownのUserInputSanitizer(strict)と同じ範囲。
 * Markdownから作ったもの(コードの言語・脚注・チェックリスト・数式)に要るものだけ足す。
 * 埋め込み(scriptとiframe)は #241 で扱うので、いまは通さない
 */
export const qiitaSchema: Schema = {
  // 脚注などのidに「user-content-」をつけない(Qiitaと同じidにする)
  clobberPrefix: "",
  clobber: [],
  tagNames: [
    ...["a", "b", "blockquote", "br", "caption", "code", "dd", "del"],
    ...["details", "div", "dl", "dt", "em", "font"],
    ...["h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd"],
    ...["li", "ol", "p", "pre", "q", "rp", "rt", "ruby", "s", "samp"],
    ...["section", "strike", "strong", "sub", "summary", "sup"],
    ...["table", "tbody", "td", "tfoot", "th", "thead", "tr", "ul", "var"],
    // チェックリスト(Markdownから作る)
    "input",
  ],
  attributes: {
    a: [
      "className",
      "href",
      "rel",
      "title",
      "id",
      // 脚注(Markdownから作る)
      "dataFootnoteRef",
      "dataFootnoteBackref",
      "ariaDescribedBy",
      "ariaLabel",
    ],
    blockquote: ["cite"],
    // 言語(language-*)と数式(math-*)。Markdownから作る
    // 言語とファイル名はremarkQiitaCodeがつける
    code: [
      ["className", /^language-/, /^math-/],
      "dataMetadata",
      "dataLang",
      "dataFilename",
    ],
    div: ["className", "dataType", "dataMetadata"],
    details: ["open"],
    font: ["color"],
    h1: ["id"],
    h2: ["id", ["className", "sr-only"]],
    h3: ["id"],
    h4: ["id"],
    h5: ["id"],
    h6: ["id"],
    img: ["alt", "height", "src", "title", "width"],
    ins: ["cite", "dateTime"],
    li: ["id", ["className", "task-list-item"]],
    q: ["cite"],
    section: ["className", "dataFootnotes"],
    sup: ["id"],
    td: ["colSpan", "rowSpan", "style", "align"],
    th: ["colSpan", "rowSpan", "style", "align"],
    input: [
      ["type", "checkbox"],
      ["disabled", true],
      "checked",
      ["className", "task-list-item-checkbox"],
    ],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    cite: ["http", "https"],
    src: ["http", "https"],
  },
  // 中身ごと消すもの(Ruby の Sanitize と同じ)
  strip: [
    ...["iframe", "math", "noembed", "noframes", "noscript", "plaintext"],
    ...["script", "style", "svg", "xmp"],
  ],
};

/** 表のセルのstyleは、text-alignとborderだけ残す(Qiitaと同じ) */
const STYLE_ALLOWED = /^\s*(text-align|border)\s*:/i;

export function rehypeQiitaStyle() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const style = node.properties.style;
      if (typeof style !== "string") return;
      const kept = style
        .split(";")
        .filter((d) => STYLE_ALLOWED.test(d))
        .map((d) => d.trim())
        .join("; ");
      if (kept === "") delete node.properties.style;
      else node.properties.style = kept;
    });
  };
}
