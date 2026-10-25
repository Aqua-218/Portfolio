/**
 * 管理画面からQiitaに記事を出す。Worker(/admin/qiita)を通すので、Qiitaのトークンはここには来ない。
 * 決まりはActionsの投稿(apps/web/scripts/qiita.mjs)と同じ:
 * - idがなければ投稿する。ただし同じタイトルの記事がもうQiitaにあれば、それを自分の記事として使う
 * - Qiitaのほうが、前に書き戻した日時より新しく直されていれば、聞いてから上書きする
 * - 中身が同じなら送らない
 */
import type { PostDoc } from "./post";

/** Qiitaの記事(使う項目だけ) */
export interface Item {
  id: string;
  title: string;
  body: string;
  private: boolean;
  slide?: boolean;
  tags: { name: string }[];
  updated_at: string;
  url: string;
}

/** Workerを通してQiita APIを呼ぶ。404はnull */
async function qiita(
  method: "GET" | "POST" | "PATCH",
  path: string,
  body?: unknown,
): Promise<Item | Item[] | null> {
  const res = await fetch(`/admin/qiita?path=${encodeURIComponent(path)}`, {
    method,
    credentials: "same-origin",
    headers: {
      "X-Admin": "1",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as Item | Item[];
}

/** Qiitaに送る中身 */
export function toQiita(doc: PostDoc) {
  const m = doc.meta;
  return {
    title: m.title,
    body: doc.body,
    tags: m.tags.map((name) => ({ name, versions: [] })),
    private: m.private,
    slide: m.slide,
    ...(m.organizationUrlName === ""
      ? {}
      : { organization_url_name: m.organizationUrlName }),
  };
}

/** 改行の違いと、終わりの改行の数は比べない */
const norm = (s: string) => s.replace(/\r\n/g, "\n").replace(/\n+$/, "");

/** 手元の記事とQiitaの記事が、送る中身として同じか */
export function same(doc: PostDoc, item: Item): boolean {
  const m = doc.meta;
  return (
    m.title === item.title &&
    norm(doc.body) === norm(item.body) &&
    m.private === item.private &&
    m.slide === Boolean(item.slide) &&
    JSON.stringify(m.tags) === JSON.stringify(item.tags.map((t) => t.name))
  );
}

/** どうするか */
export type Step =
  | { action: "create" }
  | { action: "update"; item: Item }
  /** 中身は同じ。idと日時を書き戻すだけ */
  | { action: "record"; item: Item }
  /** Qiitaのほうが新しく直されている。上書きするかは人が決める */
  | { action: "conflict"; item: Item };

export function plan(doc: PostDoc, item: Item | null): Step {
  if (!item) return { action: "create" };
  if (same(doc, item)) return { action: "record", item };
  const recorded = doc.meta.updatedAt;
  if (
    recorded === "" ||
    item.id !== doc.meta.id ||
    Date.parse(item.updated_at) > Date.parse(recorded)
  )
    return { action: "conflict", item };
  return { action: "update", item };
}

/** 自分のQiitaの記事から、同じタイトルのものを探す */
async function findByTitle(title: string): Promise<Item | null> {
  for (let page = 1; page <= 10; page++) {
    const items = (await qiita(
      "GET",
      `/api/v2/authenticated_user/items?page=${String(page)}&per_page=100`,
    )) as Item[] | null;
    const found = items?.find((i) => i.title === title);
    if (found) return found;
    if (!items || items.length < 100) return null;
  }
  return null;
}

/** いまのQiitaの記事を見て、どうするか決める */
export async function check(doc: PostDoc): Promise<Step> {
  const item =
    doc.meta.id === ""
      ? await findByTitle(doc.meta.title)
      : ((await qiita("GET", `/api/v2/items/${doc.meta.id}`)) as Item | null);
  if (doc.meta.id !== "" && item === null)
    throw new Error("Qiitaにこのidの記事がありません");
  return plan(doc, item);
}

/** 決めたとおりに出す。返すのは書き戻すidと日時 */
export async function run(doc: PostDoc, step: Step): Promise<Item> {
  if (step.action === "create")
    return (await qiita("POST", "/api/v2/items", toQiita(doc))) as Item;
  if (step.action === "record") return step.item;
  return (await qiita(
    "PATCH",
    `/api/v2/items/${step.item.id}`,
    toQiita(doc),
  )) as Item;
}
