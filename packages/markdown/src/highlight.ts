import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createCssVariablesTheme, createHighlighter } from "shiki";
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
