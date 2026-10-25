import type { Post } from "@portfolio/content-types";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { site } from "./content";
import { toc } from "@portfolio/markdown";
import { qiitaMarkdown } from "./markdown";

/** 記法の見本のページ(/blog/sample/)。記事のファイル名には使えない(content-check) */
export const SAMPLE = "sample";

/** リポジトリのいちばん上 */
const ROOT = path.join(process.cwd(), "../..");

/** 記事の日付。公開はファイルが初めて入った日、更新は最後に変わった日(どちらもgitの履歴から) */
export interface Dates {
  published: string;
  updated: string;
}

export type { TocItem } from "@portfolio/markdown";

/** サイトに出す記事。Qiitaの限定公開(private)のものは出さない */
export function posts(): Post[] {
  return site().blog.filter((p) => !p.private);
}

/** タグの一覧。記事の多い順、同じなら名前の順 */
export function tags(): { name: string; count: number }[] {
  const count = new Map<string, number>();
  for (const p of posts())
    for (const t of p.tags) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count]
    .map(([name, n]) => ({ name, count: n }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

const datesCache = new Map<string, Dates>();

/**
 * gitの履歴から、記事の日付を読む。まだコミットしていない記事(書いている途中)は今日にする。
 * CIでは履歴を全部取ってくる(fetch-depth: 0)
 */
export function dates(slug: string): Dates {
  const cached = datesCache.get(slug);
  if (cached) return cached;
  const today = new Date().toISOString().slice(0, 10);
  let lines: string[] = [];
  try {
    lines = execFileSync(
      "git",
      ["log", "--follow", "--format=%cI", "--", `content/blog/${slug}.md`],
      { cwd: ROOT, encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean);
  } catch {
    // gitがない
  }
  const day = (iso: string | undefined) => iso?.slice(0, 10) ?? today;
  const result = { published: day(lines.at(-1)), updated: day(lines[0]) };
  datesCache.set(slug, result);
  return result;
}

/** 新しい順(公開した日、同じならファイル名の順) */
export function sorted(list: Post[]): Post[] {
  return [...list].sort(
    (a, b) =>
      dates(b.slug).published.localeCompare(dates(a.slug).published) ||
      a.slug.localeCompare(b.slug),
  );
}

/** 記事の本文のHTMLと目次 */
export async function body(post: Pick<Post, "body">) {
  const html = await qiitaMarkdown(post.body);
  return { html, toc: toc(html) };
}
