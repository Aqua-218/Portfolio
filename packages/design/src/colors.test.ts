import { describe, expect, it } from "vitest";
import { dark, light } from "./colors";
import { contrastRatio, toHex } from "./contrast";

describe.each([
  ["ライト", light],
  ["ダーク", dark],
])("%s", (_, palette) => {
  it("本文(ink)と背景(paper)のコントラスト比が4.5:1以上", () => {
    expect(contrastRatio(palette.ink, palette.paper)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("補足の文字(muted)と背景(paper)のコントラスト比が4.5:1以上", () => {
    expect(contrastRatio(palette.muted, palette.paper)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("タグの文字(ink)とタグ地(tatami)のコントラスト比が4.5:1以上", () => {
    expect(contrastRatio(palette.ink, palette.tatami)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

describe("contrastRatio", () => {
  it("同じ色なら1", () => {
    expect(contrastRatio(light.paper, light.paper)).toBeCloseTo(1);
  });

  it("黒と白なら21", () => {
    expect(
      contrastRatio({ l: 0, c: 0, h: 0 }, { l: 1, c: 0, h: 0 }),
    ).toBeCloseTo(21, 0);
  });
});

describe("toHex", () => {
  it("白と黒", () => {
    expect(toHex({ l: 1, c: 0, h: 0 })).toBe("#ffffff");
    expect(toHex({ l: 0, c: 0, h: 0 })).toBe("#000000");
  });

  it("Mermaidのメモの色は、モックの#f2e0c8と#4a3a2aになる", () => {
    expect(toHex(light.note)).toBe("#f2e0c8");
    expect(toHex(dark.note)).toBe("#4a3a2a");
  });
});
