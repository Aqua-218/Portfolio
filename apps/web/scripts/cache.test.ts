// @vitest-environment node
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { prune } from "./cache.mjs";

type Prune = (dir: string) => { mermaid: string[]; ogp: string[] };

function cache(used: string | null): string {
  const dir = mkdtempSync(path.join(tmpdir(), "cache-"));
  mkdirSync(path.join(dir, "mermaid"));
  writeFileSync(path.join(dir, "mermaid", "aaaa.svg"), "<svg/>");
  writeFileSync(path.join(dir, "mermaid", "bbbb.svg"), "<svg/>");
  writeFileSync(
    path.join(dir, "ogp.json"),
    JSON.stringify({ "https://a.example/": {}, "https://b.example/": {} }),
  );
  if (used !== null) writeFileSync(path.join(dir, ".used"), used);
  return dir;
}

describe("prune", () => {
  it("使った図とOGPだけ残す", () => {
    const dir = cache("mermaid aaaa\nogp https://b.example/\nmermaid aaaa\n");
    expect((prune as Prune)(dir)).toEqual({
      mermaid: ["bbbb.svg"],
      ogp: ["https://a.example/"],
    });
    expect(readdirSync(path.join(dir, "mermaid"))).toEqual(["aaaa.svg"]);
    expect(
      Object.keys(
        JSON.parse(readFileSync(path.join(dir, "ogp.json"), "utf8")) as object,
      ),
    ).toEqual(["https://b.example/"]);
    // .usedは消す
    expect(existsSync(path.join(dir, ".used"))).toBe(false);
  });

  it(".usedがなければ、何も消さない", () => {
    const dir = cache(null);
    expect((prune as Prune)(dir)).toEqual({ mermaid: [], ogp: [] });
    expect(readdirSync(path.join(dir, "mermaid"))).toHaveLength(2);
  });
});
