/**
 * 互換テストのための、HTMLの意味だけを取り出した形。
 * 本物のqiita-markdownの出力(見た目はQiitaのもの)と、このサイトの出力(見た目はサイトのもの)を、
 * 同じ決まりで同じ形にして比べる。見た目だけの違い(クラス・アイコン・色づけ・猫)は捨てる
 */
import type { Element, ElementContent, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { replaceMath, textContent } from "./rehype";

type Side = "qiita" | "site";

const hasClass = (node: Element, name: string) => {
  const c = node.properties.className;
  return Array.isArray(c) && c.includes(name);
};

/** 前後の空白をつめた文字 */
const squash = (s: string) => s.replace(/\s+/g, " ").trim();

/** 数式は、TeXの元の文字だけを残す */
function mathMark(source: string, display: boolean): ElementContent[] {
  return [
    {
      type: "element",
      tagName: "x-math",
      properties: { dataDisplay: display ? "block" : "inline" },
      children: [{ type: "text", value: source.trim() }],
    },
  ];
}

/** KaTeXが書いたMathMLから、TeXの元の文字を取り出す */
function texOf(node: Element): string | undefined {
  let found: string | undefined;
  const walk = (n: ElementContent) => {
    if (n.type !== "element") return;
    if (n.tagName === "annotation") found = textContent(n);
    n.children.forEach(walk);
  };
  walk(node);
  return found;
}

/** 子孫の中の最初のこのタグの要素 */
function findTag(node: Element, tag: string): Element | undefined {
  for (const c of node.children) {
    if (c.type !== "element") continue;
    if (c.tagName === tag) return c;
    const found = findTag(c, tag);
    if (found) return found;
  }
  return undefined;
}

function attrs(pairs: [string, unknown][]): string {
  const kept = pairs.filter(
    ([, v]) => v !== undefined && v !== null && v !== false,
  );
  return kept.length === 0
    ? ""
    : `[${kept.map(([k, v]) => (v === true ? k : `${k}=${String(v)}`)).join(",")}]`;
}

function children(nodes: ElementContent[], side: Side): string {
  return nodes
    .map((n) => one(n, side))
    .filter((s) => s !== "")
    .join(" ");
}

function one(node: ElementContent, side: Side): string {
  if (node.type === "text") return squash(node.value);
  if (node.type !== "element") return "";
  const p = node.properties;
  const tag = node.tagName;

  if (tag === "x-math")
    return `math${p.dataDisplay === "block" ? "[display]" : ""}{${textContent(node)}}`;
  if (tag === "br") return "⏎";

  // 埋め込み。Qiitaはそのまま、このサイトはiframe(data-embedに種類と鍵)
  if (side === "site" && tag === "div" && hasClass(node, "embed")) {
    const frame = findTag(node, "iframe");
    return `embed[${String(frame?.properties.dataEmbed)}]`;
  }
  if (side === "qiita") {
    if (tag === "iframe") return `embed[iframe:${String(p.src)}]`;
    if (tag === "blockquote" && hasClass(node, "twitter-tweet")) {
      const href = findTag(node, "a")?.properties.href;
      const id = /\/status\/(\d+)/.exec(String(href))?.[1];
      return `embed[tweet:${String(id)}]`;
    }
    if (tag === "p" && hasClass(node, "codepen"))
      return `embed[codepen:${String(p.dataUser)}/${String(p.dataSlugHash)}]`;
    if (tag === "script") {
      if (hasClass(node, "speakerdeck-embed"))
        return `embed[speakerdeck:${String(p.dataId)}]`;
      if (hasClass(node, "docswell-embed"))
        return `embed[docswell:${String(p.dataSrc)}]`;
      const cast = /asciinema\.org\/a\/([\w-]+)\.js$/.exec(String(p.src))?.[1];
      // Xやcodepenのスクリプトは、上の引用やpといっしょに1つの埋め込み
      return cast ? `embed[asciinema:${cast}]` : "";
    }
  }

  // 注意書き
  if (side === "qiita" && tag === "div" && hasClass(node, "note")) {
    const type = (p.className as string[]).find((c) => c !== "note") ?? "info";
    const body = node.children.find(
      (c): c is Element => c.type === "element" && c.tagName === "div",
    );
    return `note[${type}]{${children(body?.children ?? [], side)}}`;
  }
  if (side === "site" && tag === "div" && p.dataNote !== undefined) {
    const body = node.children.find(
      (c): c is Element => c.type === "element" && c.tagName === "div",
    );
    return `note[${String(p.dataNote)}]{${children(body?.children ?? [], side)}}`;
  }

  // コード
  if (
    (side === "qiita" && tag === "div" && hasClass(node, "code-frame")) ||
    (side === "site" && tag === "figure" && hasClass(node, "code-frame"))
  ) {
    const caption = node.children.find(
      (c): c is Element =>
        c.type === "element" &&
        (hasClass(c, "code-lang") || c.tagName === "figcaption"),
    );
    const pre = findTag(node, "pre");
    const code = pre ? textContent(pre).replace(/\n$/, "") : "";
    // ```mathは、Qiitaではブラウザで数式になる
    if (p.dataLang === "math") return `math[display]{${code.trim()}}`;
    return `code${attrs([
      ["lang", p.dataLang],
      ["file", caption ? squash(textContent(caption)) : undefined],
    ])}{${JSON.stringify(code)}}`;
  }

  // 脚注の見出し(このサイトだけ、読み上げ用につける)
  if (side === "site" && tag === "h2" && hasClass(node, "sr-only")) return "";

  // 見出し
  if (/^h[1-6]$/.test(tag)) {
    const id =
      side === "qiita"
        ? node.children.find(
            (c): c is Element =>
              c.type === "element" && hasClass(c, "fragment"),
          )?.properties.id
        : p.id;
    // Qiitaは頭に飛び先とアイコンのリンク、このサイトは見出しの中身ごとリンク
    const body =
      side === "qiita"
        ? node.children.filter(
            (c) =>
              !(
                c.type === "element" &&
                (hasClass(c, "fragment") ||
                  (c.tagName === "a" && findTag(c, "i") !== undefined))
              ),
          )
        : node.children.filter(
            (c) => !(c.type === "element" && hasClass(c, "heading-anchor")),
          );
    const anchor = typeof id === "string" ? `#${id}` : "";
    return `${tag}${anchor}{${children(body, side)}}`;
  }

  // 絵文字とメンション
  if (side === "qiita" && tag === "img" && hasClass(node, "emoji"))
    return `emoji[${String(p.title).slice(1, -1)}]`;
  if (side === "site" && tag === "span" && hasClass(node, "emoji"))
    return `emoji[${String(p.title).slice(1, -1)}]`;
  if (tag === "a" && hasClass(node, "user-mention"))
    return `mention[${String(p.title)}]`;

  // 数式(このサイトはKaTeXのMathML)
  if (side === "site" && tag === "span" && hasClass(node, "katex")) {
    const display = findTag(node, "math")?.properties.display === "block";
    return `math${display ? "[display]" : ""}{${(texOf(node) ?? "").trim()}}`;
  }
  // 色の見本
  if (tag === "span" && hasClass(node, "inline-code-color"))
    return `swatch{${String(p.style).replace(/;\s*$/, "")}}`;

  const kept = attrs([
    [
      "href",
      tag === "a" && typeof p.href === "string" ? decodeURI(p.href) : undefined,
    ],
    ["id", tag === "a" || tag === "li" ? p.id : undefined],
    ["src", tag === "img" ? p.src : undefined],
    ["alt", tag === "img" ? p.alt : undefined],
    ["checked", tag === "input" ? Boolean(p.checked) : undefined],
    [
      "align",
      tag === "td" || tag === "th"
        ? (p.align ??
          /text-align:\s*(\w+)/.exec(
            typeof p.style === "string" ? p.style : "",
          )?.[1])
        : undefined,
    ],
  ]);
  // 見た目のためだけのまとまりは、中身だけにする
  if (tag === "span" || (tag === "div" && hasClass(node, "highlight")))
    return children(node.children, side);
  return `${tag}${kept}{${children(node.children, side)}}`;
}

/** HTMLを、比べるための形にする */
export function canonical(html: string, side: Side): string {
  const tree: Root = fromHtml(html, { fragment: true });
  if (side === "qiita") replaceMath(tree, mathMark);
  return tree.children
    .map((n) => one(n as ElementContent, side))
    .filter((s) => s !== "")
    .join("\n");
}
