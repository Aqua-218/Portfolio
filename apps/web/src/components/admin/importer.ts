/**
 * もうQiitaにある記事を、ブログの記事(content/blog/*.md)の下書きにする。
 * 先頭はQiita CLIと同じ形で、idと日時を入れる(あとで公開しても、Qiitaと中身が同じなので何もしない)。
 * 記事の中の画像は、Qiitaのものをそのまま参照する
 */
import { draftBranch, readFile } from "./github";
import { slugProblem } from "./NewPost";
import { type PostDoc, parsePost } from "./post";
import type { Item } from "./qiita";

/** 取り込むときに使うQiitaの記事の項目 */
export type QiitaItem = Item & {
  organization_url_name?: string | null;
  created_at?: string;
};

/** Qiitaの記事を、ブログの記事の形にする。本文はそのまま */
export function toPost(item: QiitaItem): PostDoc {
  return {
    meta: {
      title: item.title,
      tags: item.tags.map((t) => t.name),
      private: item.private,
      updatedAt: item.updated_at,
      id: item.id,
      organizationUrlName: item.organization_url_name ?? "",
      slide: item.slide ?? false,
      ignorePublish: false,
    },
    body: item.body.endsWith("\n") ? item.body : `${item.body}\n`,
  };
}

/** ファイル名のはじめの案。タイトルの英数字の語から作り、なければidから */
export function suggestSlug(item: Pick<Item, "id" | "title">): string {
  const words = item.title.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const slug = words.join("-").slice(0, 48).replace(/-+$/, "");
  return slug.length >= 3 ? slug : `qiita-${item.id.slice(0, 8)}`;
}

/** 選んだものの名前が使えるか。使えなければ理由。同じ名前を2つ選んでいてもだめ */
export function problems(
  picked: readonly { id: string; slug: string }[],
  taken: ReadonlySet<string>,
): Map<string, string> {
  const out = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const p of picked) seen.set(p.slug, (seen.get(p.slug) ?? 0) + 1);
  for (const p of picked) {
    const problem =
      p.slug === ""
        ? "ファイル名を入れてください。"
        : (seen.get(p.slug) ?? 0) > 1
          ? "同じファイル名を2つ選んでいます。"
          : slugProblem(p.slug, taken);
    if (problem !== "") out.set(p.id, problem);
  }
  return out;
}

/** ブログの記事(mainと下書き)に入っているQiitaのid。もう取り込んだものを分けるのに使う */
export async function importedIds(
  paths: readonly string[],
  drafts: ReadonlySet<string>,
): Promise<Set<string>> {
  const isPost = (p: string) =>
    p.startsWith("content/blog/") && p.endsWith(".md");
  const files = await Promise.all([
    ...paths.filter(isPost).map((p) => readFile(p).catch(() => null)),
    ...[...drafts]
      .filter(isPost)
      .map((p) => readFile(p, draftBranch(p)).catch(() => null)),
  ]);
  return new Set(
    files
      .map((f) => (f ? parsePost(f.text)?.meta.id : undefined))
      .filter((id): id is string => id !== undefined && id !== ""),
  );
}

/** 自分のQiitaの記事を全部(100件ずつ、1000件まで) */
export async function myItems(): Promise<QiitaItem[]> {
  const items: QiitaItem[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `/admin/qiita?path=${encodeURIComponent(`/api/v2/authenticated_user/items?page=${String(page)}&per_page=100`)}`,
      { credentials: "same-origin", headers: { "X-Admin": "1" } },
    );
    if (!res.ok) throw new Error(String(res.status));
    const got = (await res.json()) as QiitaItem[];
    items.push(...got);
    if (got.length < 100) break;
  }
  return items;
}
