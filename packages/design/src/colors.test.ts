import { describe, expect, it } from "vitest";
import { dark, light } from "./colors";
import { contrastRatio } from "./contrast";

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
