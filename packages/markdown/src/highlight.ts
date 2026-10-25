import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import type { Element, Root } from "hast";
import {
  type BundledLanguage,
  bundledLanguages,
  bundledLanguagesInfo,
  createCssVariablesTheme,
  createHighlighter,
} from "shiki";
import { visit } from "unist-util-visit";
import tla from "./grammars/tla.json" with { type: "json" };

/**
 * 猫のテーマ。色はCSS変数(--shiki-token-keywordなど)で出し、
 * 中身はサイトのテーマの色に結ぶ(apps/webのcode.css.ts)。ライトとダークはそちらで切り替わる。
 */
export const catTheme = createCssVariablesTheme({
  name: "cat",
  variablePrefix: "--shiki-",
  fontStyle: true,
});

// 型はもとのテーマに色がないので、--shiki-token-typeで出す
catTheme.tokenColors = [
  ...(catTheme.tokenColors ?? []),
  {
    scope: [
      "entity.name.type",
      "support.type",
      "entity.name.type.module",
      "support.class",
    ],
    settings: { foreground: "var(--shiki-token-type)" },
  },
];

/** 色をつける言語。ここにない言語は色なしで出す */
export const langs = [
  "rust",
  "typescript",
  "tsx",
  "javascript",
  "lean4",
  "toml",
  "yaml",
  "json",
  "bash",
  "markdown",
] as const;

let highlighter: ReturnType<typeof createHighlighter> | undefined;

/** 色づけの道具。作るのに時間がかかるので、1回だけ作る */
export function getHighlighter() {
  highlighter ??= createHighlighter({
    themes: [catTheme],
    langs: [...langs, tla],
  });
  return highlighter;
}

export { rehypeShikiFromHighlighter };

/**
 * 記事で使っている言語を、Shikiの持っているものから読み込む(ブログの記事用)。
 * サイトのページは決まった言語(langs)だけだが、Qiitaの記事はどの言語でも書けるため。
 * Shikiが知らない言語は読み込まず、色なしで出す
 */
export function rehypeLoadLanguages(ready: ReturnType<typeof getHighlighter>) {
  return async (tree: Root) => {
    const wanted = new Set<string>();
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "code") return;
      const cls = node.properties.className;
      if (!Array.isArray(cls)) return;
      for (const c of cls) {
        const lang =
          typeof c === "string" ? /^language-(.+)$/.exec(c)?.[1] : undefined;
        if (lang) wanted.add(lang.toLowerCase());
      }
    });
    if (wanted.size === 0) return;
    const h = await ready;
    const loaded = new Set(h.getLoadedLanguages());
    for (const lang of wanted) {
      if (loaded.has(lang)) continue;
      // 名前か別名(rb・pyなど)から、Shikiの言語を探す
      const id = bundledLanguagesInfo.find(
        (l) => l.id === lang || l.aliases?.includes(lang),
      )?.id;
      if (id === undefined || !(id in bundledLanguages)) continue;
      await h.loadLanguage(id as BundledLanguage);
    }
  };
}
