import { describe, expect, it } from "vitest";
import { byField } from "./validate";

const p = (message: string) => ({
  line: 1,
  message,
  text: `content/x:1: ${message}`,
});

describe("byField", () => {
  it("項目名で始まる間違いをその欄に、ほかは本文に分ける", () => {
    const m = byField([
      p("date は YYYY-MM-DD の形の、実在する日付にしてください"),
      p("venue の前後に空白があります"),
      p("本文が空です"),
      p("datetime という項目はありません"),
    ]);
    expect(m.get("date")).toEqual([
      "date は YYYY-MM-DD の形の、実在する日付にしてください",
    ]);
    expect(m.get("venue")).toHaveLength(1);
    expect(m.get("body")).toEqual([
      "本文が空です",
      "datetime という項目はありません",
    ]);
    expect(m.has("title")).toBe(false);
  });
});
