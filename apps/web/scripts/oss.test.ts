// @vitest-environment node
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readTexts, spdxIds, textId } from "./oss.mjs";

describe("spdxIds", () => {
  it("ライセンスの式から識別子を取り出す", () => {
    expect(spdxIds("MIT OR Apache-2.0")).toEqual(["MIT", "Apache-2.0"]);
    expect(spdxIds("(MPL-2.0 OR Apache-2.0)")).toEqual([
      "MPL-2.0",
      "Apache-2.0",
    ]);
    // 古いクレートの書き方
    expect(spdxIds("MIT/Apache-2.0")).toEqual(["MIT", "Apache-2.0"]);
  });
});

describe("readTexts", () => {
  it("LICENSEがなければ空。1つならそのまま、いくつかあれば名前をつけてつなげる", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "oss-"));
    expect(readTexts(dir)).toBe("");
    writeFileSync(path.join(dir, "LICENSE-MIT"), "MIT text\r\n\n");
    writeFileSync(path.join(dir, "index.js"), "");
    expect(readTexts(dir)).toBe("MIT text\n");
    writeFileSync(path.join(dir, "LICENSE-APACHE"), "Apache text\n");
    expect(readTexts(dir)).toBe(
      "==> LICENSE-APACHE <==\n\nApache text\n\n==> LICENSE-MIT <==\n\nMIT text\n",
    );
  });

  it("原文が同じなら、同じid", () => {
    expect(textId("a\n")).toBe(textId("a\n"));
    expect(textId("a\n")).not.toBe(textId("b\n"));
    expect(textId("a\n")).toMatch(/^oss-[0-9a-f]{10}$/);
  });
});
