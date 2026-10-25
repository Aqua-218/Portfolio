import { describe, expect, it } from "vitest";
import { parsePost, serializePost } from "./post";
import { problems, type QiitaItem, suggestSlug, toPost } from "./importer";

const ID = "0123456789abcdef0123";
const IMAGE =
  "https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/123/cat.png";

const item: QiitaItem = {
  id: ID,
  title: "Rustで猫を描く: WebAssembly編",
  body: `# はじめに\n\n![cat.png](${IMAGE})`,
  private: false,
  slide: false,
  tags: [{ name: "Rust" }, { name: "WebAssembly" }],
  updated_at: "2026-10-01T12:34:56+09:00",
  url: `https://qiita.com/neko/items/${ID}`,
  organization_url_name: null,
};

describe("toPost", () => {
  it("Qiita CLIと同じ形の先頭(idと日時つき)にし、本文と画像のURLはそのまま", () => {
    const text = serializePost(toPost(item));
    expect(text).toBe(`---
title: "Rustで猫を描く: WebAssembly編"
tags:
  - Rust
  - WebAssembly
private: false
updated_at: '2026-10-01T12:34:56+09:00'
id: ${ID}
organization_url_name: null
slide: false
ignorePublish: false
---
# はじめに

![cat.png](${IMAGE})
`);
    expect(parsePost(text)).toEqual(toPost(item));
  });

  it("限定公開・スライド・organizationも引き継ぐ", () => {
    const meta = toPost({
      ...item,
      private: true,
      slide: true,
      organization_url_name: "team",
    }).meta;
    expect(meta).toMatchObject({
      private: true,
      slide: true,
      organizationUrlName: "team",
    });
  });
});

describe("suggestSlug", () => {
  it("タイトルの英数字から作る。なければidから", () => {
    expect(suggestSlug(item)).toBe("rust-webassembly");
    expect(suggestSlug({ id: ID, title: "猫の話" })).toBe("qiita-01234567");
  });
});

describe("problems", () => {
  it("空・使えない字・もうある名前・選んだもの同士のかぶりを止める", () => {
    const taken = new Set(["content/blog/cat.md"]);
    const got = problems(
      [
        { id: "a", slug: "" },
        { id: "b", slug: "猫" },
        { id: "c", slug: "cat" },
        { id: "d", slug: "dup" },
        { id: "e", slug: "dup" },
        { id: "f", slug: "ok" },
      ],
      taken,
    );
    expect([...got.keys()]).toEqual(["a", "b", "c", "d", "e"]);
  });
});
