import { describe, expect, it } from "vitest";
import { frameIndex } from "./motion";

const frames = (
  motion: Parameters<typeof frameIndex>[0],
  count: number,
  index = 0,
) =>
  Array.from({ length: count }, (_, n) => frameIndex(motion, n, index)).join(
    "",
  );

describe("frameIndex", () => {
  it("しっぽは5回ごとに振る", () => {
    expect(frames("tail", 20)).toBe("00000111110000011111");
  });

  it("座る猫は4回ごとに動く", () => {
    expect(frames("sit", 16)).toBe("0000111100001111");
  });

  it("走る猫は2回ごとに脚を入れ替える", () => {
    expect(frames("run", 8)).toBe("00110011");
  });

  it("のぞく猫は37回に1回だけ目を閉じる", () => {
    const seq = frames("blink", 74);
    expect(seq.split("").filter((c) => c === "1")).toHaveLength(2);
    expect(seq[0]).toBe("1");
    expect(seq[37]).toBe("1");
  });

  it("毛づくろいは3回ごと、へそ天は4回ごとにコマを入れ替える", () => {
    expect(frames("groom", 12)).toBe("000111000111");
    expect(frames("roll", 16)).toBe("0000111100001111");
  });

  it("飛びつく猫は長く構えて、少しだけ飛ぶ", () => {
    const seq = frames("pounce", 52);
    expect(seq).toBe(`${"0".repeat(21)}11111${"0".repeat(21)}11111`);
  });

  it("毛づくろい・へそ天・飛びつくも、猫ごとにずれる", () => {
    for (const m of ["groom", "roll", "pounce"] as const)
      expect(frames(m, 26, 0), m).not.toBe(frames(m, 26, 1));
  });

  it("瞬きは猫ごとにずれる", () => {
    const first = frames("blink", 37, 0).indexOf("1");
    const second = frames("blink", 37, 1).indexOf("1");
    expect(first).not.toBe(second);
  });
});
