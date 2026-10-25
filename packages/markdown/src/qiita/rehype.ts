/**
 * Qiitaの記法の、HTMLになってからの処理。qiita-markdownのフィルターと同じことをする。
 * 見た目はサイトに合わせる(注意書きは猫つき、コードは猫のテーマ、数式はMathML)。
 * 同じかどうかは、src/qiita/fixtures/ の正解(本物のqiita-markdown)と突き合わせて確かめる
 */
import { gemoji } from "gemoji";
import type { Element, ElementContent, Root, Text } from "hast";
import { fromHtml } from "hast-util-from-html";
import katex from "katex";
import { SKIP, visit } from "unist-util-visit";

type Parent = Root | Element;

function el(
  tagName: string,
  properties: Element["properties"],
  children: ElementContent[] = [],
): Element {
  return { type: "element", tagName, properties, children };
}

function text(value: string): Text {
  return { type: "text", value };
}

/** 要素の中の文字(NokogiriのtextやtextContentと同じ) */
export function textContent(node: ElementContent | Root): string {
  if (node.type === "text") return node.value;
  if (node.type === "element" || node.type === "root")
    return node.children.map((c) => textContent(c as ElementContent)).join("");
  return "";
}

/** 祖先にこのタグの要素があるか */
function inside(ancestors: Parent[], tags: ReadonlySet<string>): boolean {
  return ancestors.some((a) => a.type === "element" && tags.has(a.tagName));
}

/**
 * 文字のノードを、祖先をたどりながら見ていく。fnが新しいノードの並びを返したら置きかえる
 */
function eachText(
  tree: Root,
  skip: ReadonlySet<string>,
  fn: (node: Text) => ElementContent[] | undefined,
) {
  const walk = (parent: Parent, ancestors: Parent[]) => {
    const next: ElementContent[] = [];
    let changed = false;
    for (const child of parent.children as ElementContent[]) {
      if (child.type === "text" && !inside([...ancestors, parent], skip)) {
        const replaced = fn(child);
        if (replaced) {
          next.push(...replaced);
          changed = true;
          continue;
        }
      }
      if (child.type === "element") walk(child, [...ancestors, parent]);
      next.push(child);
    }
    if (changed) parent.children = next;
  };
  walk(tree, []);
}

// ---- 見出し(HeadingAnchor・Toc) ----

/**
 * 見出しのid。Qiitaと同じく、小文字にし、文字・数字・_・-・空白のほかを消して、空白を-にする。
 * 同じものが2つめからは-1、-2をつける
 */
export function rehypeQiitaHeadings() {
  return (tree: Root) => {
    const count = new Map<string, number>();
    visit(tree, "element", (node: Element) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      // 脚注の読み上げ用の見出しは、記事の見出しではない
      const cls = node.properties.className;
      if (Array.isArray(cls) && cls.includes("sr-only")) return;
      const base = textContent(node)
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\p{Nd}\p{Pc}\- ]/gu, "")
        .replaceAll(" ", "-");
      const n = count.get(base) ?? 0;
      count.set(base, n + 1);
      const id = n > 0 ? `${base}-${String(n)}` : base;
      // 中身のない見出しには、Qiitaと同じくidもリンクもつけない
      if (node.children.length === 0) return SKIP;
      node.properties.id = id;
      // Qiitaと同じく、見出しの頭にそのidへのリンクを置く。
      // 見出しの中身ごとリンクにすると、中にリンクのある見出しでリンクが入れ子になる
      node.children.unshift(
        el("a", {
          className: ["heading-anchor"],
          href: `#${id}`,
          ariaLabel: "この見出しへのリンク",
        }),
      );
      return SKIP;
    });
  };
}

// ---- 注意書き(CustomBlock) ----

/** Qiitaの:::noteの種類と、サイトの注意書き(猫つき)の種類 */
const NOTES = { info: "NOTE", warn: "WARNING", alert: "CAUTION" } as const;

/**
 * `:::note warn`(blocks.tsでdivにしたもの)を、サイトの注意書きにする。
 * 種類がinfo・warn・alertでなければinfo。noteでないブロックは、ただのdivにする
 */
export function rehypeQiitaNotes() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "div" || node.properties.dataType !== "customblock")
        return;
      const metadata = String(node.properties.dataMetadata ?? "");
      const [type, subtype = ""] = metadata.split(" ");
      delete node.properties.dataType;
      delete node.properties.dataMetadata;
      if (type !== "note") return;
      const note = subtype in NOTES ? (subtype as keyof typeof NOTES) : "info";
      const kind = NOTES[note];
      const body = node.children;
      node.properties = {
        className: ["callout", `callout-${kind.toLowerCase()}`],
        dataNote: note,
      };
      node.children = [
        // 猫はrehypeAlertsが描く
        el("span", {
          className: ["callout-cat"],
          ariaHidden: "true",
          dataKind: kind,
        }),
        el("div", {}, body),
      ];
    });
  };
}

// ---- 絵文字(Emoji) ----

const EMOJI = new Map(gemoji.flatMap((g) => g.names.map((n) => [n, g.emoji])));

/** `:smile:`を絵文字にする。コードの中はそのまま */
export function rehypeQiitaEmoji() {
  const skip = new Set(["pre", "code", "tt"]);
  return (tree: Root) => {
    eachText(tree, skip, (node) => {
      const parts = node.value.split(/(:[\w+-]+:)/);
      if (parts.length === 1) return undefined;
      const out = parts.flatMap((part): ElementContent[] => {
        const name = /^:([\w+-]+):$/.exec(part)?.[1];
        const emoji = name === undefined ? undefined : EMOJI.get(name);
        if (name === undefined || emoji === undefined)
          return part === "" ? [] : [text(part)];
        return [
          el(
            "span",
            {
              className: ["emoji"],
              title: `:${name}:`,
              role: "img",
              ariaLabel: name,
            },
            [text(emoji)],
          ),
        ];
      });
      return out.some((n) => n.type === "element") ? out : undefined;
    });
  };
}

// ---- メンション(Mention) ----

/**
 * `@ユーザー名`。qiita-markdownのMentionPatternを、JavaScriptの正規表現にしたもの。
 * (?>…)(後戻りしないまとまり)は、先読みと後方参照で同じにする
 */
const MENTION =
  /(^|[^\w])@(?=(\w[\w-]{0,30}\w(?:@github)?))\2(?!\/)(?=\.+[ \t\W]|\.+$|[^0-9a-zA-Z_.]|$)/gim;

/** `@ユーザー名`をQiitaのユーザーのページへのリンクにする。引用・コード・リンクの中はそのまま */
export function rehypeQiitaMentions() {
  const skip = new Set(["pre", "code", "a", "style", "script", "blockquote"]);
  return (tree: Root) => {
    eachText(tree, skip, (node) => {
      const out: ElementContent[] = [];
      let last = 0;
      for (const m of node.value.matchAll(MENTION)) {
        const name = m[2] ?? "";
        const at = m.index + (m[1] ?? "").length;
        if (at > last) out.push(text(node.value.slice(last, at)));
        out.push(
          el(
            "a",
            {
              href: `https://qiita.com/${name}`,
              className: ["user-mention"],
              title: name,
            },
            [text(`@${name}`)],
          ),
        );
        last = at + name.length + 1;
      }
      if (out.length === 0) return undefined;
      if (last < node.value.length) out.push(text(node.value.slice(last)));
      return out;
    });
  };
}

// ---- リンクと画像(ImageLink・ExternalLink) ----

/**
 * リンクの中にない画像を、画像そのものへのリンクで包む。
 * 外へのリンクは新しいタブで開き、nofollowとnoopenerをつける
 */
export function rehypeQiitaLinks() {
  return (tree: Root) => {
    const walk = (parent: Parent, inLink: boolean) => {
      parent.children = (parent.children as ElementContent[]).map((child) => {
        if (child.type !== "element") return child;
        if (child.tagName === "img" && !inLink) {
          return el("a", { href: child.properties.src, target: "_blank" }, [
            child,
          ]);
        }
        walk(child, inLink || child.tagName === "a");
        return child;
      });
    };
    walk(tree, false);
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = node.properties.href;
      if (typeof href === "string" && /^https?:\/\//i.test(href)) {
        node.properties.rel = ["nofollow", "noopener"];
        node.properties.target = "_blank";
      }
    });
  };
}

// ---- インラインのコードの色(InlineCodeColor) ----

const COLOR = new RegExp(
  `^\\s*(${[
    /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/,
    /rgba?\(\s*(?:\d+(?:,|\s)\s*){2}\d+\s*\)/,
    /rgba?\(\s*(?:\d+%(?:,|\s)\s*){2}\d+%\s*\)/,
    /rgba?\(\s*(?:\d+,\s*){3}\d*\.?\d+%?\s*\)/,
    /rgba?\(\s*(?:\d+\s*){2}\d+\s*\/\s*\d?\.?\d+%?\s*\)/,
    /rgba?\(\s*(?:\d+%\s*){2}\d+%\s*\/\s*\d?\.?\d+%?\s*\)/,
    /hsla?\(\s*\d+(?:deg|rad|grad|turn)?,\s*\d+%,\s*\d+%\s*\)/,
    /hsla?\(\s*\d+(?:deg|rad|grad|turn)?\s+\d+%\s+\d+%\s*\)/,
    /hsla?\(\s*\d+(?:deg|rad|grad|turn)?,\s*(?:\d+%,\s*){2}\d?\.?\d+%?\s*\)/,
    /hsla?\(\s*\d+(?:deg|rad|grad|turn)?\s+\d+%\s+\d+%\s*\/\s*\d?\.?\d+%?\s*\)/,
  ]
    .map((r) => r.source)
    .join("|")})\\s*$`,
);

/** `#ff0000`のような色だけのインラインのコードに、その色の見本をつける */
export function rehypeQiitaCodeColor() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, _i, parent) => {
      if (node.tagName !== "code") return;
      if (parent?.type === "element" && parent.tagName === "pre") return;
      const color = COLOR.exec(textContent(node))?.[1]?.trim();
      if (!color) return;
      node.children.push(
        el("span", {
          className: ["inline-code-color"],
          style: `background-color: ${color};`,
        }),
      );
    });
  };
}

/** <pre>の中の<code>。言語とファイル名はここにある */
function codeOf(pre: Element): Element | undefined {
  const code = pre.children.find(
    (c): c is Element => c.type === "element" && c.tagName === "code",
  );
  return code;
}

// ---- 数式(InlineMathとMathJax) ----

/**
 * `$`のすぐ内側のインラインのコード($`x^2`$)を、数式の文字にする(InlineMath)。
 * コードの中はMarkdownのエスケープが効かないので、Qiitaではこう書くと確実に数式になる
 */
export function rehypeQiitaInlineMath() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const kids = node.children;
      for (let i = 1; i < kids.length - 1; i++) {
        const code = kids[i];
        const open = kids[i - 1];
        const close = kids[i + 1];
        if (
          code?.type !== "element" ||
          code.tagName !== "code" ||
          open?.type !== "text" ||
          close?.type !== "text" ||
          !open.value.endsWith("$") ||
          open.value.endsWith("$$") ||
          !close.value.startsWith("$") ||
          close.value.startsWith("$$")
        )
          continue;
        open.value = open.value.slice(0, -1);
        close.value = close.value.slice(1);
        kids[i] = el("span", {}, [text(`$${textContent(code)}$`)]);
      }
      node.children = kids.filter((k) => k.type !== "text" || k.value !== "");
    });
  };
}

/** TeXをMathMLにする。描けなければTeXのまま赤く出す(KaTeXのthrowOnError: false) */
function tex(source: string, display: boolean): ElementContent[] {
  const html = katex.renderToString(source, {
    displayMode: display,
    output: "mathml",
    throwOnError: false,
    strict: false,
  });
  return fromHtml(html, { fragment: true }).children as ElementContent[];
}

/** MathJaxが数式を探さない要素 */
const NO_MATH = new Set([
  ...["script", "noscript", "style", "textarea", "pre", "code"],
  ...["annotation", "annotation-xml", "math"],
]);

/** 数式の区切り。見つかったものの始まり・終わり(区切りの外側)と、ディスプレイかどうか */
interface Found {
  start: number;
  end: number;
  source: string;
  display: boolean;
}

/** `{`と`}`の数が合っているか(MathJaxは合っていないものを数式にしない) */
function balanced(s: string): boolean {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "\\") i++;
    else if (s[i] === "{") depth++;
    else if (s[i] === "}" && --depth < 0) return false;
  }
  return depth === 0;
}

/**
 * 文字の中の`$$…$$`(ディスプレイ)と`$…$`(インライン)を探す。MathJaxのFindTeXと同じく前から順に。
 * `\$`は数式の区切りにしない
 */
export function findTex(s: string): Found[] {
  const found: Found[] = [];
  let i = 0;
  while (i < s.length) {
    if (s[i] === "\\") {
      i += 2;
      continue;
    }
    if (s[i] !== "$") {
      i++;
      continue;
    }
    const display = s[i + 1] === "$";
    const open = display ? 2 : 1;
    let j = i + open;
    let end = -1;
    while (j < s.length) {
      if (s[j] === "\\") {
        j += 2;
        continue;
      }
      if (display ? s.startsWith("$$", j) : s[j] === "$") {
        end = j;
        break;
      }
      j++;
    }
    const source = end < 0 ? "" : s.slice(i + open, end);
    if (end < 0 || source.trim() === "" || !balanced(source)) {
      i += open;
      continue;
    }
    found.push({ start: i, end: end + open, source, display });
    i = end + open;
  }
  return found;
}

/**
 * 数式を描く。QiitaはMarkdownをHTMLにしたあと、ブラウザでMathJaxが文字の中の`$`を探す。
 * それと同じく、HTMLにしたあとの文字(改行の<br>をまたいでよい)から探して、ビルドでMathMLにする。
 * そのため、`$$`の中でもMarkdownのエスケープ(`\,`が`,`になるなど)はQiitaと同じく効く。
 * ```mathのコードは、ディスプレイの数式にする
 */
export function rehypeQiitaMath() {
  return (tree: Root) => {
    replaceMath(tree, tex);
  };
}

/** 数式を見つけて、renderで置きかえる。互換テストでは、TeXの元の文字を残すrenderを渡す */
export function replaceMath(
  tree: Root,
  render: (source: string, display: boolean) => ElementContent[],
) {
  // ```math
  visit(tree, "element", (node: Element, index, parent) => {
    if (node.tagName !== "pre" || codeOf(node)?.properties.dataLang !== "math")
      return;
    if (!parent || index === undefined) return;
    parent.children.splice(index, 1, ...render(textContent(node).trim(), true));
    return [SKIP, index];
  });

  const walk = (parent: Parent) => {
    const kids = parent.children as ElementContent[];
    const next: ElementContent[] = [];
    let i = 0;
    const isRun = (k: ElementContent | undefined) =>
      k?.type === "text" || (k?.type === "element" && k.tagName === "br");
    while (i < kids.length) {
      const kid = kids[i];
      if (!isRun(kid)) {
        if (kid?.type === "element" && !NO_MATH.has(kid.tagName)) walk(kid);
        if (kid) next.push(kid);
        i++;
        continue;
      }
      // 続いている文字と<br>をまとめて1つの文字にする(<br>は改行)
      const run: (Text | Element)[] = [];
      while (i < kids.length && isRun(kids[i])) {
        run.push(kids[i] as Text | Element);
        i++;
      }
      next.push(...replaceTex(run, render));
    }
    parent.children = next;
  };
  walk(tree);
}

/** 文字と<br>の並びの中の数式を、MathMLに置きかえる */
function replaceTex(
  run: (Text | Element)[],
  render: (source: string, display: boolean) => ElementContent[],
): ElementContent[] {
  const s = run.map((n) => (n.type === "text" ? n.value : "\n")).join("");
  const found = findTex(s);
  if (found.length === 0) return run;
  /** 文字の並びのうち[from, to)を、文字と<br>に戻す */
  const back = (from: number, to: number): ElementContent[] =>
    s
      .slice(from, to)
      .split("\n")
      .flatMap((part, k): ElementContent[] => [
        ...(k > 0 ? [el("br", {})] : []),
        ...(part === "" ? [] : [text(part)]),
      ]);
  const out: ElementContent[] = [];
  let last = 0;
  for (const f of found) {
    out.push(...back(last, f.start), ...render(f.source, f.display));
    last = f.end;
  }
  out.push(...back(last, s.length));
  return out;
}

// ---- コードの枠(CodeBlockとSyntaxHighlight) ----

/**
 * コードを、言語とファイル名のついた枠に入れる。
 * `<figure class="code-frame" data-lang="ruby"><figcaption class="code-lang">app.rb</figcaption><pre>…</pre></figure>`
 * 色づけはこのあとShikiがする。diff_rubyのような差分は、差分として色をつける
 */
export function rehypeQiitaCode() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName !== "pre" || !parent || index === undefined) return;
      const code = codeOf(node);
      if (!code) return;
      const lang = String(code.properties.dataLang ?? "text");
      const filename = code.properties.dataFilename;
      delete code.properties.dataLang;
      delete code.properties.dataFilename;
      if (lang.startsWith("diff_"))
        code.properties.className = ["language-diff"];
      parent.children[index] = el(
        "figure",
        { className: ["code-frame"], dataLang: lang },
        [
          ...(typeof filename === "string"
            ? [el("figcaption", { className: ["code-lang"] }, [text(filename)])]
            : []),
          node,
        ],
      );
      return SKIP;
    });
  };
}
