/** content/のファイルを、管理画面の一覧に出すために種類ごとに分ける */

export interface Item {
  path: string;
  /** 一覧に出す名前 */
  label: string;
}

export interface Group {
  key: string;
  title: string;
  items: Item[];
}

/** 1つだけのファイルの名前 */
const FILES: Readonly<Record<string, string>> = {
  "content/profile.toml": "プロフィール",
  "content/skills.toml": "スキル",
  "content/work.toml": "仕事",
  "content/affiliations.toml": "所属",
  "content/events.toml": "年度の一言",
  "content/shelf.toml": "本棚",
  "content/cats.toml": "猫の写真の説明",
  "content/licenses.toml": "ライセンス",
};

const KINDS = [
  { key: "events", title: "イベント", dir: "content/events/" },
  { key: "blog", title: "ブログ", dir: "content/blog/" },
  { key: "pages", title: "ページ", dir: null },
  { key: "cats", title: "猫の写真", dir: "content/cats/" },
  { key: "icons", title: "アイコン", dir: "content/icons/" },
  { key: "other", title: "そのほか", dir: null },
] as const;

/** ファイルの名前(ディレクトリを除く) */
function base(path: string): string {
  return path.slice(path.lastIndexOf("/") + 1);
}

/** 種類ごとに分け、`query`で絞り込む。空のグループは出さない */
export function group(paths: readonly string[], query = ""): Group[] {
  const q = query.trim().toLowerCase();
  const groups = KINDS.map((k) => ({
    key: k.key,
    title: k.title,
    items: [] as Item[],
  }));
  const find = (key: string) => groups.find((g) => g.key === key);
  for (const path of [...paths].sort()) {
    const fixed = FILES[path];
    const kind = fixed
      ? "pages"
      : (KINDS.find((k) => k.dir !== null && path.startsWith(k.dir))?.key ??
        "other");
    const label =
      fixed ?? (kind === "other" ? path.replace(/^content\//, "") : base(path));
    if (q !== "" && !`${label} ${path}`.toLowerCase().includes(q)) continue;
    find(kind)?.items.push({ path, label });
  }
  return groups.filter((g) => g.items.length > 0);
}
