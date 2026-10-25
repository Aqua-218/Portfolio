import { describe, expect, it } from "vitest";
import { qiitaState, summarize } from "./dashboard";

const check = (status: string, conclusion: string | null = null) => ({
  name: "c",
  status,
  conclusion,
});

describe("summarize", () => {
  it("1つでも落ちていれば落ち、動いているものがあれば待ち、全部済めば通り", () => {
    expect(summarize([])).toBe("none");
    expect(
      summarize([check("completed", "success"), check("in_progress")]),
    ).toBe("pending");
    expect(
      summarize([check("in_progress"), check("completed", "failure")]),
    ).toBe("failed");
    expect(
      summarize([check("completed", "success"), check("completed", "skipped")]),
    ).toBe("passed");
  });
});

describe("qiitaState", () => {
  const ID = "0123456789abcdef0123";
  const meta = {
    id: ID,
    updatedAt: "2026-10-01T00:00:00+09:00",
    ignorePublish: false,
  };

  it("書き戻した日時とQiitaの日時を比べる", () => {
    expect(
      qiitaState(meta, [{ id: ID, updated_at: "2026-10-01T00:00:00+09:00" }]),
    ).toBe("synced");
    expect(
      qiitaState(meta, [{ id: ID, updated_at: "2026-10-02T00:00:00+09:00" }]),
    ).toBe("ahead");
  });

  it("まだ出していない・出さない・Qiitaを見られないとき", () => {
    expect(qiitaState({ ...meta, id: "" }, [])).toBe("new");
    expect(qiitaState({ ...meta, ignorePublish: true }, null)).toBe("ignored");
    expect(qiitaState(meta, null)).toBe("unknown");
    expect(qiitaState(meta, [])).toBe("unknown");
  });
});
