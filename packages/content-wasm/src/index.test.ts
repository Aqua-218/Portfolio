import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { check, checkFile, load } from "./index";

// テストはpackages/content-wasmで走る
const root = path.join(process.cwd(), "../../content");

/** content/のファイルを全部読む */
function content(): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else files.set(path.relative(root, full), readFileSync(full));
    }
  };
  walk(root);
  return files;
}

beforeAll(async () => {
  await load(
    readFileSync(path.join(process.cwd(), "dist/content_wasm_bg.wasm")),
  );
});

describe("check", () => {
  it("いまのcontent/は間違いなく読める", async () => {
    const checked = await check(content());
    expect(checked.problems).toEqual([]);
    expect(checked.site?.events.length).toBeGreaterThan(0);
  });

  it("間違いはビルドと同じ形の文で出る", async () => {
    const files = content();
    const rel = "events/2026-08-10-seccamp.md";
    const text = new TextDecoder().decode(files.get(rel));
    files.set(
      rel,
      new TextEncoder().encode(
        text.replace("date: 2026-08-10", "date: 2026-02-30"),
      ),
    );
    const checked = await check(files);
    expect(checked.site).toBeNull();
    expect(checked.problems).toHaveLength(1);
    expect(checked.problems[0]).toMatch(
      /^content\/events\/2026-08-10-seccamp\.md:\d+: /,
    );
  });
});

describe("checkFile", () => {
  it("ファイル1つの間違いを、ビルドと同じ文で出す", async () => {
    const checked = await checkFile(
      "events/2026-08-10-seccamp.md",
      "---\ntitle: a\ndate: 2026-02-30\nvenue: b\n---\n\nほんぶん\n",
    );
    expect(checked.supported).toBe(true);
    expect(checked.problems).toHaveLength(1);
    expect(checked.problems[0]?.line).toBe(3);
    expect(checked.problems[0]?.text).toMatch(
      /^content\/events\/2026-08-10-seccamp\.md:3: date /,
    );
  });

  it("一つだけでは確かめられないものは、そう返す", async () => {
    expect((await checkFile("cats.toml", "")).supported).toBe(false);
  });
});
