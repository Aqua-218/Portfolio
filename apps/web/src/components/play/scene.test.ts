import { describe, expect, it } from "vitest";
import { ACTS, COATS, scene } from "./scene";

describe("scene", () => {
  it("同じ種なら、いつも同じ場面", () => {
    expect(scene("about", 3)).toEqual(scene("about", 3));
  });

  it("種が違えば、たいてい違う場面になる", () => {
    const seeds = [
      "home",
      "about",
      "skills",
      "work",
      "events",
      "cats",
      "stack",
      "blog",
    ];
    const shapes = new Set(
      seeds.map((s) =>
        JSON.stringify(scene(s, 3).map((a) => [a.act, a.coats])),
      ),
    );
    expect(shapes.size).toBe(seeds.length);
  });

  it("1つの場面では、遊び方を重ねない。毛色も5匹までは重ねない", () => {
    for (const seed of ["a", "b", "c", "d"]) {
      const s = scene(seed, 4);
      expect(new Set(s.map((a) => a.act)).size).toBe(4);
      const coats = s.flatMap((a) => a.coats).slice(0, COATS.length);
      expect(new Set(coats).size).toBe(coats.length);
    }
  });

  it("どの遊び方も、どこかのページで出る", () => {
    const seen = new Set(
      Array.from({ length: 40 }, (_, i) => scene(`p${String(i)}`, 3))
        .flat()
        .map((a) => a.act),
    );
    expect([...seen].sort()).toEqual([...ACTS].sort());
  });
});
