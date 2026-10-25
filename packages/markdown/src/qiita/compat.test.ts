import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { render } from "../index";
import { canonical } from "./canonical";

// テストはpackages/markdownで走る
const dir = path.join(process.cwd(), "src/qiita/fixtures");
const fixtures = readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .map((f) => f.slice(0, -3));

/**
 * 本物のqiita-markdown(qiita/golden.shで作った *.qiita.html)と、意味が同じHTMLになるか。
 * 見た目の違い(クラス・アイコン・色づけ・猫)は比べない(canonical.ts)
 */
describe("Qiitaの記法の互換", () => {
  it.each(fixtures)("%s", async (name) => {
    const md = readFileSync(path.join(dir, `${name}.md`), "utf8");
    const qiita = readFileSync(path.join(dir, `${name}.qiita.html`), "utf8");
    const site = await render(md, { flavor: "qiita" });
    expect(canonical(site, "site")).toBe(canonical(qiita, "qiita"));
  });
});
