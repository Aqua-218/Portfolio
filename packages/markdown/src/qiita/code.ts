import type { Code, Root } from "mdast";
import { visit } from "unist-util-visit";

/** Qiitaと同じ言語の読みかえ */
const ALIASES: Readonly<Record<string, string>> = {
  el: "common-lisp",
  hack: "php",
  zsh: "bash",
};

/**
 * ファイル名だけのとき(```main.rs)の、拡張子からの言語。
 * Qiitaはrouge(Ruby)で推し量るので、よく使うものをrougeの名前で書く
 */
const BY_EXTENSION: Readonly<Record<string, string>> = {
  rs: "rust",
  rb: "ruby",
  py: "python",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "tsx",
  jsx: "jsx",
  go: "go",
  java: "java",
  kt: "kotlin",
  swift: "swift",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  sh: "shell",
  bash: "shell",
  ps1: "powershell",
  sql: "sql",
  html: "html",
  css: "css",
  scss: "scss",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  md: "markdown",
  xml: "xml",
  lua: "lua",
  hs: "haskell",
  ex: "elixir",
  exs: "elixir",
  scala: "scala",
  dart: "dart",
  vue: "vue",
};

/**
 * コードの囲みの情報(```ruby:app.rb)から、言語とファイル名を読む。qiita-markdownのCodeBlock::Metadataと同じ。
 * - `ruby` → 言語ruby
 * - `ruby:app.rb` → 言語ruby、ファイル名app.rb
 * - `app.rb` → ファイル名app.rb、言語は拡張子から
 * - `js:src/a:b.js` → 言語js、ファイル名src/a:b.js(2つめの:からはファイル名)
 */
export function codeMetadata(info: string | null): {
  language: string | null;
  filename: string | null;
} {
  if (info === null) return { language: null, filename: null };
  const split = info.split(":");
  const sections =
    split.length <= 2 ? split : [split[0] ?? "", split.slice(1).join(":")];
  const [first = "", second] = sections;
  const onlyFilename = second === undefined && first.includes(".");
  if (onlyFilename) {
    const ext = first.split(".").pop()?.toLowerCase() ?? "";
    return { language: BY_EXTENSION[ext] ?? null, filename: first };
  }
  return {
    language: ALIASES[first] ?? first,
    filename: second ?? null,
  };
}

/**
 * コードの囲みに、Qiitaと同じ言語とファイル名をつける。
 * 言語はShikiの色づけに、ファイル名と元の言語の名前は、あとでrehypeQiitaCodeが枠に使う
 */
export function remarkQiitaCode() {
  return (tree: Root) => {
    visit(tree, "code", (node: Code) => {
      const info = node.lang
        ? [node.lang, node.meta].filter(Boolean).join(" ")
        : null;
      const { language, filename } = codeMetadata(info);
      node.lang = language;
      node.meta = null;
      node.data = {
        ...node.data,
        hProperties: {
          ...(node.data?.hProperties ?? {}),
          ...(language ? { dataLang: language } : {}),
          ...(filename ? { dataFilename: filename } : {}),
        },
      };
    });
  };
}
