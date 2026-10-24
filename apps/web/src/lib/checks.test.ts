import { describe, expect, it } from "vitest";
import { checks, countLeanLibs, countSpecs } from "./checks";

describe("countLeanLibs", () => {
  it("[[lean_lib]]の数を数え、[[require]]は数えない", () => {
    const lakefile = `name = "proofs"
[[require]]
name = "aeneas"

[[lean_lib]]
name = "PxCat"

[[lean_lib]]
name = "Other"
`;
    expect(countLeanLibs(lakefile)).toBe(2);
  });
});

describe("countSpecs", () => {
  it("壊した設定と実行例の設定は数えない", () => {
    expect(
      countSpecs([
        "Curtain.cfg",
        "Curtain.tla",
        "CurtainBroken.cfg",
        "CurtainTraceAll.cfg",
        "tlc.sh",
      ]),
    ).toBe(1);
  });
});

describe("checks", () => {
  it("リポジトリから数えると、猫も幕も1つ以上ある", () => {
    const { cats, curtains } = checks();
    expect(cats).toBeGreaterThanOrEqual(1);
    expect(curtains).toBeGreaterThanOrEqual(1);
  });
});
