// @vitest-environment node
import { describe, expect, it } from "vitest";
import { plan, same, toQiita, writeBack } from "./qiita.mjs";

const post = {
  slug: "rust-cat",
  title: "Rustで猫を描く",
  tags: ["Rust", "WebAssembly"],
  private: false,
  updatedAt: "2026-10-25T13:00:00+09:00",
  id: "0123456789abcdef0123",
  organizationUrlName: null,
  slide: false,
  ignorePublish: false,
  body: "# はじめに\n\n本文\n",
};

const item = {
  id: "0123456789abcdef0123",
  title: "Rustで猫を描く",
  body: "# はじめに\r\n\r\n本文",
  private: false,
  slide: false,
  tags: [
    { name: "Rust", versions: [] },
    { name: "WebAssembly", versions: [] },
  ],
  updated_at: "2026-10-25T13:00:00+09:00",
};

describe("toQiita", () => {
  it("Qiita API v2の形にする", () => {
    expect(toQiita(post)).toEqual({
      title: "Rustで猫を描く",
      body: "# はじめに\n\n本文\n",
      tags: [
        { name: "Rust", versions: [] },
        { name: "WebAssembly", versions: [] },
      ],
      private: false,
      slide: false,
    });
  });
});

describe("same", () => {
  it("改行の違いと終わりの改行は比べない", () => {
    expect(same(post, item)).toBe(true);
  });
  it("タグや本文が違えば違う", () => {
    expect(same({ ...post, tags: ["Rust"] }, item)).toBe(false);
    expect(same({ ...post, body: "変えた" }, item)).toBe(false);
  });
});

describe("plan", () => {
  it("idもQiitaの記事もなければ投稿する", () => {
    expect(plan({ ...post, id: null, updatedAt: null }, null)).toEqual({
      action: "create",
    });
  });
  it("同じで、書き戻したものとも同じなら何もしない", () => {
    expect(plan(post, item).action).toBe("none");
  });
  it("同じタイトルの記事がQiitaにあり、中身も同じなら、それを記録する(二重に投稿しない)", () => {
    expect(plan({ ...post, id: null, updatedAt: null }, item).action).toBe(
      "record",
    );
  });
  it("手元で直したなら更新する", () => {
    expect(plan({ ...post, body: "直した" }, item).action).toBe("update");
  });
  it("Qiitaのほうがあとで直されていたら、上書きしない", () => {
    expect(
      plan(
        { ...post, body: "直した" },
        { ...item, updated_at: "2026-10-26T09:00:00+09:00" },
      ).action,
    ).toBe("skip");
  });
  it("書き戻したことのない記事が、Qiitaのものと違えば、上書きしない", () => {
    expect(
      plan({ ...post, id: null, updatedAt: null, body: "別" }, item).action,
    ).toBe("skip");
  });
});

describe("writeBack", () => {
  it("Qiita CLIの形のidとupdated_atだけを書き換える", () => {
    const src =
      "---\ntitle: t\ntags:\n  - Rust\nprivate: false\nupdated_at: ''\nid: null\norganization_url_name: null\nslide: false\nignorePublish: false\n---\n本文\n";
    expect(
      writeBack(src, { id: "abc", updatedAt: "2026-10-25T13:00:00+09:00" }),
    ).toBe(
      "---\ntitle: t\ntags:\n  - Rust\nprivate: false\nupdated_at: '2026-10-25T13:00:00+09:00'\nid: abc\norganization_url_name: null\nslide: false\nignorePublish: false\n---\n本文\n",
    );
  });
  it("項目がなければ足す", () => {
    expect(
      writeBack("---\ntitle: t\ntags: [Rust]\n---\n本文\n", {
        id: "abc",
        updatedAt: "2026-10-25T13:00:00+09:00",
      }),
    ).toBe(
      "---\ntitle: t\ntags: [Rust]\nupdated_at: '2026-10-25T13:00:00+09:00'\nid: abc\n---\n本文\n",
    );
  });
});
