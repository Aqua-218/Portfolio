import { describe, expect, it } from "vitest";
import {
  activity,
  perWeek,
  qiitaState,
  summarize,
  weekStarts,
} from "./dashboard";

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

describe("weekStarts・perWeek", () => {
  it("月曜はじまりの週に分け、古すぎるものは捨てる", () => {
    // 2026-10-25は日曜
    const starts = weekStarts(new Date(2026, 9, 25, 15), 3);
    expect(
      starts.map((d) => [d.getMonth() + 1, d.getDate(), d.getDay()]),
    ).toEqual([
      [10, 5, 1],
      [10, 12, 1],
      [10, 19, 1],
    ]);
    const iso = (m: number, d: number, h = 12) =>
      new Date(2026, m - 1, d, h).toISOString();
    const got = perWeek(
      [iso(10, 4), iso(10, 5, 0), iso(10, 11), iso(10, 19), iso(10, 25), "x"],
      (x) => x,
      starts,
    );
    expect(got.map((w) => w.length)).toEqual([2, 0, 2]);
  });
});

describe("activity", () => {
  it("コミットと公開を新しい順に混ぜる", () => {
    const got = activity(
      [
        {
          sha: "a",
          message: "content: 1",
          at: "2026-10-20T00:00:00Z",
          url: "",
        },
        {
          sha: "b",
          message: "content: 2",
          at: "2026-10-22T00:00:00Z",
          url: "",
        },
      ],
      [
        {
          name: "deploy",
          title: "",
          status: "completed",
          conclusion: "failure",
          at: "2026-10-21T00:00:00Z",
          url: "",
        },
      ],
    );
    expect(got.map((a) => a.title)).toEqual([
      "content: 2",
      "deploy",
      "content: 1",
    ]);
    expect(got[1]?.summary).toBe("failed");
  });
});
