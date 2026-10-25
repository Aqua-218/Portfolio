import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { EMPTY, parsePost, serializePost } from "./post";

/** Qiita CLIが書く形 */
const CLI = `---
title: 'Rustで猫を描く: ドット絵'
tags:
  - Rust
  - WebAssembly
private: false
updated_at: '2026-10-01T12:34:56+09:00'
id: 0123456789abcdef0123
organization_url_name: null
slide: false
ignorePublish: false
---
# はじめに

本文です。
`;

describe("parsePost", () => {
  it("Qiita CLIの形を読む", () => {
    expect(parsePost(CLI)).toEqual({
      meta: {
        title: "Rustで猫を描く: ドット絵",
        tags: ["Rust", "WebAssembly"],
        private: false,
        updatedAt: "2026-10-01T12:34:56+09:00",
        id: "0123456789abcdef0123",
        organizationUrlName: "",
        slide: false,
        ignorePublish: false,
      },
      body: "# はじめに\n\n本文です。\n",
    });
  });

  it("まだ出していない記事(npx qiita newの形)", () => {
    const doc = parsePost(
      "---\ntitle: 新しい記事\ntags:\n  - ''\nprivate: false\nupdated_at: ''\nid: null\norganization_url_name: null\nslide: false\nignorePublish: false\n---\n本文\n",
    );
    expect(doc?.meta).toEqual({ ...EMPTY, title: "新しい記事" });
  });

  it("タグは[a, b]の形でも読む", () => {
    const doc = parsePost("---\ntitle: t\ntags: [a, 'b c']\n---\n本文\n");
    expect(doc?.meta.tags).toEqual(["a", "b c"]);
  });

  it("知らない項目や読めない値があれば、フォームでは扱わない", () => {
    expect(parsePost("---\ntitle: t\ntags: [a]\nfoo: 1\n---\n本文\n")).toBe(
      null,
    );
    expect(
      parsePost("---\ntitle: t\ntags: [a]\nslide: maybe\n---\n本文\n"),
    ).toBe(null);
    expect(parsePost("本文だけ\n")).toBe(null);
  });
});

describe("serializePost", () => {
  it("Qiita CLIと同じ形に書き、読み戻すと同じになる", () => {
    const doc = parsePost(CLI);
    expect(doc).not.toBe(null);
    if (doc === null) return;
    expect(serializePost(doc)).toBe(
      CLI.replace("'Rustで猫を描く: ドット絵'", '"Rustで猫を描く: ドット絵"'),
    );
    expect(parsePost(serializePost(doc))).toEqual(doc);
  });

  it("本文は1文字も変えない(Qiitaに送る中身と同じにする)", () => {
    const body = "\n\n先頭の空行も  \r\n終わりの改行も\n\n\n";
    const doc = { meta: { ...EMPTY, title: "t", tags: ["a"] }, body };
    expect(parsePost(serializePost(doc))?.body).toBe(body);
  });

  it("引用符や「: 」の入った値も、読み戻すと同じになる", () => {
    const doc = {
      meta: {
        ...EMPTY,
        title: `"引用" と 'それ': #1`,
        tags: ["C#", "a,b"],
        organizationUrlName: "neko",
      },
      body: "本文\n",
    };
    expect(parsePost(serializePost(doc))).toEqual(doc);
  });

  it("content/blogの記事は、読んで書くと元のまま", () => {
    const dir = path.join(import.meta.dirname, "../../../../../content/blog");
    let files: string[] = [];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith(".md"));
    } catch {
      // まだ記事がない
    }
    for (const f of files) {
      const src = readFileSync(path.join(dir, f), "utf8");
      const doc = parsePost(src);
      if (doc) expect(parsePost(serializePost(doc)), f).toEqual(doc);
    }
  });
});
