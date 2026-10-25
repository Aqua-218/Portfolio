import { describe, expect, it } from "vitest";
import { addPhoto, PHOTO_ID } from "./photo";

describe("addPhoto", () => {
  it("cats.tomlの最後に、空行をあけて1枚足す", () => {
    const toml = '[[photo]]\nid = "kuro"\nalt = "黒猫"\ncoats = ["kuro"]\n';
    expect(
      addPhoto(toml, { id: "tama", alt: "寝ている三毛猫", coats: ["mike"] }),
    ).toBe(
      `${toml}\n[[photo]]\nid = "tama"\nalt = "寝ている三毛猫"\ncoats = ["mike"]\n`,
    );
  });

  it("引用符と\\は逃がし、改行は入れない", () => {
    expect(
      addPhoto("", { id: "a", alt: '"にゃ"\\n\nん', coats: ["kuro", "kiji"] }),
    ).toBe(
      '\n\n[[photo]]\nid = "a"\nalt = "\\"にゃ\\"\\\\nん"\ncoats = ["kuro", "kiji"]\n',
    );
  });
});

describe("PHOTO_ID", () => {
  it("英小文字・数字・ハイフンだけ", () => {
    for (const ok of ["kuro", "kaminari-04", "a1"])
      expect(PHOTO_ID.test(ok), ok).toBe(true);
    for (const ng of ["Kuro", "kuro.jpg", "-a", "a--b", "a/b", "猫", ""])
      expect(PHOTO_ID.test(ng), ng).toBe(false);
  });
});
