/**
 * ブログの記事(content/blog/*.md)の先頭を読み書きする。形はQiita CLIと同じ(crates/content/src/blog.rs)。
 * 正しいかどうかはcontentの検証(Wasm)で確かめる
 */
import { list, quote, scalar } from "./frontmatter";

export interface PostMeta {
  title: string;
  tags: string[];
  /** Qiitaの限定公開。サイトには出さない */
  private: boolean;
  /** Qiitaで最後に更新した日時。まだ出していなければ空 */
  updatedAt: string;
  /** Qiitaの記事のid。まだ出していなければ空 */
  id: string;
  organizationUrlName: string;
  slide: boolean;
  /** Qiitaには出さない */
  ignorePublish: boolean;
}

export interface PostDoc {
  meta: PostMeta;
  /** 本文。閉じる---の次の行から、そのまま(Qiitaに送る中身と同じ) */
  body: string;
}

/** 新しい記事の先頭(Qiita CLIの`npx qiita new`と同じ) */
export const EMPTY: PostMeta = {
  title: "",
  tags: [],
  private: false,
  updatedAt: "",
  id: "",
  organizationUrlName: "",
  slide: false,
  ignorePublish: false,
};

/** nullや空なら空の文字 */
function nullable(raw: string): string {
  const v = scalar(raw);
  return v === "null" || v === "~" ? "" : v;
}

function bool(raw: string): boolean | null {
  const v = raw.trim();
  if (v === "true") return true;
  if (v === "false") return false;
  return null;
}

/** 読めなければnull。そのときは、そのままの文字で編集する */
export function parsePost(src: string): PostDoc | null {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(src);
  if (m === null) return null;
  const [, head = "", body = ""] = m;
  const meta: PostMeta = { ...EMPTY, tags: [] };
  const lines = head.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (line.trim() === "") continue;
    const at = line.indexOf(":");
    if (at < 0 || /^\s/.test(line)) return null;
    const key = line.slice(0, at).trim();
    const raw = line.slice(at + 1);
    switch (key) {
      case "title":
        meta.title = scalar(raw);
        break;
      case "tags":
        if (raw.trim() !== "") {
          meta.tags = list(raw);
          break;
        }
        // 次の行から「  - 名前」が続く
        while (/^\s+-\s/.test(lines[i + 1] ?? "")) {
          i++;
          const tag = scalar((lines[i] ?? "").replace(/^\s+-\s/, ""));
          if (tag !== "") meta.tags.push(tag);
        }
        break;
      case "updated_at":
        meta.updatedAt = nullable(raw);
        break;
      case "id":
        meta.id = nullable(raw);
        break;
      case "organization_url_name":
        meta.organizationUrlName = nullable(raw);
        break;
      case "private":
      case "slide":
      case "ignorePublish": {
        const b = bool(raw);
        if (b === null) return null;
        meta[key] = b;
        break;
      }
      // 知らない項目があれば、フォームでは扱わない
      default:
        return null;
    }
  }
  return { meta, body };
}

/** Qiita CLIと同じ順・同じ形で書く。本文はそのまま */
export function serializePost(doc: PostDoc): string {
  const m = doc.meta;
  const orNull = (v: string) => (v === "" ? "null" : quote(v));
  const lines = [
    `title: ${quote(m.title)}`,
    "tags:",
    ...(m.tags.length === 0
      ? ["  - ''"]
      : m.tags.map((t) => `  - ${quote(t)}`)),
    `private: ${String(m.private)}`,
    `updated_at: '${m.updatedAt}'`,
    `id: ${orNull(m.id)}`,
    `organization_url_name: ${orNull(m.organizationUrlName)}`,
    `slide: ${String(m.slide)}`,
    `ignorePublish: ${String(m.ignorePublish)}`,
  ];
  return `---\n${lines.join("\n")}\n---\n${doc.body}`;
}
