import { describe, expect, it } from "vitest";
import { slugProblem } from "./NewPost";

describe("slugProblem", () => {
  const taken = new Set(["content/blog/cat.md"]);

  it("英数字・「-」・「_」なら使える", () => {
    expect(slugProblem("rust-wasm_cat2", taken)).toBe("");
  });

  it("URLに入らない字・見本の名前・もうある名前は使えない", () => {
    expect(slugProblem("猫", taken)).not.toBe("");
    expect(slugProblem("a/b", taken)).not.toBe("");
    expect(slugProblem("../x", taken)).not.toBe("");
    expect(slugProblem("sample", taken)).not.toBe("");
    expect(slugProblem("cat", taken)).not.toBe("");
  });
});
