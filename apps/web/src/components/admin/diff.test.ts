import { describe, expect, it } from "vitest";
import { around, diffLines } from "./diff";

describe("diffLines", () => {
  it("変わった行を、消えたものと増えたものに分ける", () => {
    expect(diffLines("a\nb\nc", "a\nB\nc\nd")).toEqual([
      { kind: "same", text: "a" },
      { kind: "remove", text: "b" },
      { kind: "add", text: "B" },
      { kind: "same", text: "c" },
      { kind: "add", text: "d" },
    ]);
  });

  it("同じなら全部same", () => {
    expect(diffLines("x\ny", "x\ny").every((l) => l.kind === "same")).toBe(
      true,
    );
  });

  it("空から書けば、全部増えたもの", () => {
    expect(diffLines("", "a").filter((l) => l.kind === "add")).toEqual([
      { kind: "add", text: "a" },
    ]);
  });
});

describe("around", () => {
  it("変わった行の前後だけ残し、離れたところはnullでつなぐ", () => {
    const before = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].join("\n");
    const after = before.replace("2", "two").replace("8", "eight");
    const kept = around(diffLines(before, after), 1);
    expect(kept.map((l) => (l === null ? "…" : l.text))).toEqual([
      "1",
      "2",
      "two",
      "3",
      "…",
      "7",
      "8",
      "eight",
      "9",
    ]);
  });
});
