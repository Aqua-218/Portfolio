import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse, serialize } from "./frontmatter";

const SECCAMP = `---
title: セキュリティ・キャンプ全国大会
date: 2026-08-10
end: 2026-08-15
venue: 多摩 LINK FOREST
tags: [Z1ゼミ]
---

いやぁ〜〜楽しかったですよ、ほんとに。
`;

describe("parse", () => {
  it("項目と本文を分ける", () => {
    expect(parse(SECCAMP)).toEqual({
      meta: {
        title: "セキュリティ・キャンプ全国大会",
        date: "2026-08-10",
        end: "2026-08-15",
        venue: "多摩 LINK FOREST",
        tags: ["Z1ゼミ"],
      },
      body: "いやぁ〜〜楽しかったですよ、ほんとに。\n",
    });
  });

  it("知らない項目や、先頭がないものは読まない(そのままの文字で編集する)", () => {
    expect(parse("本文だけ")).toBeNull();
    expect(parse("---\ntitle: a\nnyan: 1\n---\nx")).toBeNull();
  });
});

describe("serialize", () => {
  it("読んで書くと、元と同じになる", () => {
    const doc = parse(SECCAMP);
    expect(doc && serialize(doc)).toBe(SECCAMP);
  });

  it("いまのcontent/events/は、どれも読んで書くと元と同じになる", () => {
    const dir = path.join(process.cwd(), "../../content/events");
    for (const f of readdirSync(dir)) {
      const src = readFileSync(path.join(dir, f), "utf8");
      const doc = parse(src);
      expect(doc, f).not.toBeNull();
      if (doc) expect(serialize(doc), f).toBe(src);
    }
  });

  it("空のendとtagsは書かない", () => {
    const out = serialize({
      meta: { title: "a", date: "2026-01-01", end: "", venue: "b", tags: [] },
      body: "x",
    });
    expect(out).toBe("---\ntitle: a\ndate: 2026-01-01\nvenue: b\n---\n\nx\n");
  });

  it("YAMLで意味を持つ書き方は引用符で囲み、読み直すと同じ値になる", () => {
    const meta = {
      title: "Rust: 入門 #1",
      date: "2026-01-01",
      end: "",
      venue: "- 会場",
      tags: ["true", "a, b"],
    };
    const doc = parse(serialize({ meta, body: "x" }));
    expect(doc?.meta.title).toBe("Rust: 入門 #1");
    expect(doc?.meta.venue).toBe("- 会場");
    expect(doc?.meta.tags).toEqual(["true", "a, b"]);
  });
});
