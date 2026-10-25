import { describe, expect, it } from "vitest";
import { group } from "./groups";

const PATHS = [
  "content/events/2026-08-10-seccamp.md",
  "content/events/2025-11-30-u22-final.md",
  "content/profile.toml",
  "content/skills.toml",
  "content/cats/kuro.jpg",
  "content/icons/lean.svg",
  "content/samples/markdown.md",
];

describe("group", () => {
  it("種類ごとに分け、中は名前の順", () => {
    expect(group(PATHS)).toEqual([
      {
        key: "events",
        title: "イベント",
        items: [
          {
            path: "content/events/2025-11-30-u22-final.md",
            label: "2025-11-30-u22-final.md",
          },
          {
            path: "content/events/2026-08-10-seccamp.md",
            label: "2026-08-10-seccamp.md",
          },
        ],
      },
      {
        key: "pages",
        title: "ページ",
        items: [
          { path: "content/profile.toml", label: "プロフィール" },
          { path: "content/skills.toml", label: "スキル" },
        ],
      },
      {
        key: "cats",
        title: "猫の写真",
        items: [{ path: "content/cats/kuro.jpg", label: "kuro.jpg" }],
      },
      {
        key: "icons",
        title: "アイコン",
        items: [{ path: "content/icons/lean.svg", label: "lean.svg" }],
      },
      {
        key: "other",
        title: "そのほか",
        items: [
          { path: "content/samples/markdown.md", label: "samples/markdown.md" },
        ],
      },
    ]);
  });

  it("名前とパスで絞り込み、空になったグループは出さない", () => {
    const g = group(PATHS, "seccamp");
    expect(g).toHaveLength(1);
    expect(g[0]?.items.map((i) => i.path)).toEqual([
      "content/events/2026-08-10-seccamp.md",
    ]);
  });

  it("日本語の名前でも絞り込める", () => {
    expect(group(PATHS, "プロフィール")[0]?.items).toEqual([
      { path: "content/profile.toml", label: "プロフィール" },
    ]);
  });

  it("大文字と小文字は区別しない", () => {
    expect(group(PATHS, "KURO")[0]?.key).toBe("cats");
  });
});
