/** 管理画面のダッシュボードに出すものを集める。GitHubとQiitaはWorkerを通す */
import { api, type Check, checks, readFile, REPO } from "./github";
import { parsePost } from "./post";
import type { Item } from "./qiita";

/** 開いているPR(下書きからのもの)と、そのチェック */
export interface OpenPull {
  number: number;
  title: string;
  /** 下書きのファイル(content/から) */
  path: string;
  checks: Check[];
}

/** mainで走ったActions */
export interface Run {
  name: string;
  title: string;
  status: string;
  conclusion: string | null;
  at: string;
  url: string;
}

/** チェックをまとめた様子 */
export type Summary = "pending" | "failed" | "passed" | "none";

/** チェックの一覧を1つの様子にまとめる。1つでも落ちていれば落ち、動いているものがあれば待ち */
export function summarize(list: readonly Check[]): Summary {
  if (list.length === 0) return "none";
  const ok = ["success", "skipped", "neutral"];
  if (
    list.some(
      (c) => c.status === "completed" && !ok.includes(c.conclusion ?? ""),
    )
  )
    return "failed";
  if (list.some((c) => c.status !== "completed")) return "pending";
  return "passed";
}

/** ブログの記事のQiitaへの出し具合 */
export type QiitaState =
  /** まだ出していない */
  | "new"
  /** 出した。Qiitaと同じ日時 */
  | "synced"
  /** Qiitaのほうがあとで直されている */
  | "ahead"
  /** ignorePublish */
  | "ignored"
  /** Qiitaに見つからない、またはQiitaを見られない */
  | "unknown";

export interface PostState {
  path: string;
  title: string;
  state: QiitaState;
}

/** 記事の先頭とQiitaの記事から、出し具合を決める。itemsがnullならQiitaを見られなかった */
export function qiitaState(
  meta: { id: string; updatedAt: string; ignorePublish: boolean },
  items: readonly Pick<Item, "id" | "updated_at">[] | null,
): QiitaState {
  if (meta.ignorePublish) return "ignored";
  if (meta.id === "") return "new";
  const item = items?.find((i) => i.id === meta.id);
  if (!item) return "unknown";
  return meta.updatedAt !== "" &&
    Date.parse(item.updated_at) <= Date.parse(meta.updatedAt)
    ? "synced"
    : "ahead";
}

/** 下書きのブランチから作った、開いているPRとそのチェック */
export async function openPulls(): Promise<OpenPull[]> {
  const res = await api(
    "GET",
    `/repos/${REPO}/pulls?state=open&base=main&per_page=100`,
  );
  if (!res.ok) throw new Error(String(res.status));
  const pulls = (
    (await res.json()) as {
      number: number;
      title: string;
      head: { ref: string; sha: string };
    }[]
  ).filter((p) => p.head.ref.startsWith("draft/"));
  return Promise.all(
    pulls.map(async (p) => ({
      number: p.number,
      title: p.title,
      path: `content/${p.head.ref.slice("draft/".length)}`,
      checks: await checks(p.head.sha).catch(() => []),
    })),
  );
}

/** mainで最近走ったActions */
export async function recentRuns(count = 6): Promise<Run[]> {
  const res = await api(
    "GET",
    `/repos/${REPO}/actions/runs?branch=main&per_page=${String(count)}`,
  );
  if (!res.ok) throw new Error(String(res.status));
  const { workflow_runs } = (await res.json()) as {
    workflow_runs: {
      name: string;
      display_title?: string;
      status: string;
      conclusion: string | null;
      created_at?: string;
      html_url?: string;
    }[];
  };
  return workflow_runs.slice(0, count).map((r) => ({
    name: r.name,
    title: r.display_title ?? "",
    status: r.status,
    conclusion: r.conclusion,
    at: r.created_at ?? "",
    url: r.html_url ?? "",
  }));
}

/** 自分のQiitaの記事。Qiitaを見られなければ(トークンがないなど)null */
async function qiitaItems(): Promise<Item[] | null> {
  const items: Item[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `/admin/qiita?path=${encodeURIComponent(`/api/v2/authenticated_user/items?page=${String(page)}&per_page=100`)}`,
      { credentials: "same-origin", headers: { "X-Admin": "1" } },
    );
    if (!res.ok) return null;
    const got = (await res.json()) as Item[];
    items.push(...got);
    if (got.length < 100) break;
  }
  return items;
}

/** mainのブログの記事と、そのQiitaへの出し具合 */
export async function postStates(
  paths: readonly string[],
): Promise<{ posts: PostState[]; qiita: boolean }> {
  const blog = paths.filter(
    (p) => p.startsWith("content/blog/") && p.endsWith(".md"),
  );
  if (blog.length === 0) return { posts: [], qiita: true };
  const [items, files] = await Promise.all([
    qiitaItems(),
    Promise.all(blog.map((p) => readFile(p).catch(() => null))),
  ]);
  const posts = blog.map((path, i) => {
    const doc = parsePost(files[i]?.text ?? "");
    return {
      path,
      title: doc?.meta.title ?? path,
      state: doc ? qiitaState(doc.meta, items) : ("unknown" as const),
    };
  });
  return { posts, qiita: items !== null };
}
