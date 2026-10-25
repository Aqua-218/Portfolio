import { afterEach, describe, expect, it, vi } from "vitest";
import { EMPTY, type PostDoc } from "./post";
import { check, type Item, plan, run, toQiita } from "./qiita";

const ID = "0123456789abcdef0123";

const doc = (meta: Partial<PostDoc["meta"]> = {}): PostDoc => ({
  meta: { ...EMPTY, title: "猫", tags: ["Rust"], ...meta },
  body: "本文\n",
});

const item = (over: Partial<Item> = {}): Item => ({
  id: ID,
  title: "猫",
  body: "本文",
  private: false,
  tags: [{ name: "Rust" }],
  updated_at: "2026-10-01T00:00:00+09:00",
  url: `https://qiita.com/neko/items/${ID}`,
  ...over,
});

describe("plan", () => {
  it("Qiitaになければ投稿する", () => {
    expect(plan(doc(), null)).toEqual({ action: "create" });
  });

  it("中身が同じなら送らず、idと日時だけ書き戻す", () => {
    expect(plan(doc(), item()).action).toBe("record");
  });

  it("書き戻した日時のあとにQiitaで直されていなければ、更新する", () => {
    const d = doc({ id: ID, updatedAt: "2026-10-01T00:00:00+09:00" });
    expect(plan({ ...d, body: "直した\n" }, item()).action).toBe("update");
  });

  it("Qiitaのほうが新しく直されていれば、勝手に上書きしない", () => {
    const d = doc({ id: ID, updatedAt: "2026-09-01T00:00:00+09:00" });
    expect(plan({ ...d, body: "直した\n" }, item()).action).toBe("conflict");
  });

  it("同じタイトルで見つけた記事(idをまだ書き戻していない)も、勝手に上書きしない", () => {
    expect(plan({ ...doc(), body: "直した\n" }, item()).action).toBe(
      "conflict",
    );
  });
});

describe("toQiita", () => {
  it("記事の項目だけを送る(Workerが通すものと同じ)", () => {
    expect(Object.keys(toQiita(doc())).sort()).toEqual([
      "body",
      "private",
      "slide",
      "tags",
      "title",
    ]);
    expect(
      toQiita(doc({ organizationUrlName: "team" })).organization_url_name,
    ).toBe("team");
  });
});

describe("Workerを通す", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stub(reply: (method: string, path: string) => Response) {
    const calls: { method: string; path: string; headers: HeadersInit }[] = [];
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
      const path = new URL(url, "https://komineko.jp").searchParams.get("path");
      const method = init.method ?? "GET";
      calls.push({ method, path: path ?? "", headers: init.headers ?? {} });
      return Promise.resolve(reply(method, path ?? ""));
    });
    return calls;
  }

  it("idがあれば、その記事を読む。/admin/qiitaにX-Adminをつけて呼ぶ", async () => {
    const calls = stub(() => Response.json(item()));
    const step = await check(doc({ id: ID }));
    expect(step.action).toBe("record");
    expect(calls).toEqual([
      {
        method: "GET",
        path: `/api/v2/items/${ID}`,
        headers: { "X-Admin": "1" },
      },
    ]);
  });

  it("idがなければ、自分の記事から同じタイトルのものを探す", async () => {
    const calls = stub(() => Response.json([item({ title: "別の記事" })]));
    expect((await check(doc())).action).toBe("create");
    expect(calls[0]?.path).toBe(
      "/api/v2/authenticated_user/items?page=1&per_page=100",
    );
  });

  it("投稿はPOST、更新はPATCH", async () => {
    const calls = stub(() => Response.json(item()));
    await run(doc(), { action: "create" });
    await run(doc(), { action: "update", item: item() });
    expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      "POST /api/v2/items",
      `PATCH /api/v2/items/${ID}`,
    ]);
  });

  it("Workerがことわれば、理由の番号で失敗する", async () => {
    stub(() => new Response("{}", { status: 503 }));
    await expect(check(doc({ id: ID }))).rejects.toThrow("503");
  });
});
