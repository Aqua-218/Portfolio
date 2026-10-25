// ブログの記事をQiitaに投稿・更新する。mainに記事が入ったとき、Actions(.github/workflows/qiita.yml)から走らせる。
//   QIITA_TOKEN  Qiitaのトークン(read_qiita・write_qiita)
//   CHANGED      変わったファイル(1行に1つ、content/blog/x.md)
// 記事はcontent-checkが書き出した apps/web/.content/site.json から読む(ビルドと同じ検証を通ったもの)。
// もらったidとupdated_atは記事のfrontmatterに書き戻す(Qiita CLIと同じ)。書き戻しはActionsがPRにする
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://qiita.com/api/v2";

/** Qiitaに送る中身 */
export function toQiita(post) {
  return {
    title: post.title,
    body: post.body,
    tags: post.tags.map((name) => ({ name, versions: [] })),
    private: post.private,
    slide: post.slide,
    ...(post.organizationUrlName
      ? { organization_url_name: post.organizationUrlName }
      : {}),
  };
}

/** 改行の違いと、終わりの改行の数は比べない */
const norm = (s) => s.replace(/\r\n/g, "\n").replace(/\n+$/, "");

/** 手元の記事とQiitaの記事が、送る中身として同じか */
export function same(post, item) {
  return (
    post.title === item.title &&
    norm(post.body) === norm(item.body) &&
    post.private === item.private &&
    post.slide === Boolean(item.slide) &&
    JSON.stringify(post.tags) === JSON.stringify(item.tags.map((t) => t.name))
  );
}

/**
 * frontmatterのidとupdated_atを書き換える(Qiita CLIと同じ形)。ほかの行はそのまま。
 * 項目がなければ、閉じる---の前に足す
 */
export function writeBack(source, { id, updatedAt }) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(source);
  if (!m) throw new Error("frontmatterがありません");
  let front = m[1];
  const set = (key, value) => {
    const line = `${key}: ${value}`;
    const re = new RegExp(`^${key}:.*$`, "m");
    front = re.test(front) ? front.replace(re, line) : `${front}\n${line}`;
  };
  set("updated_at", `'${updatedAt}'`);
  set("id", id);
  return `---\n${front}\n---${m[2]}${source.slice(m[0].length)}`;
}

/**
 * 1つの記事をどうするか決める。
 * - idがなければ投稿(create)。ただし同じタイトルの記事がもうQiitaにあれば、それを自分の記事として使う
 *   (投稿のあとの書き戻しが失敗したとき、二重に投稿しないため)
 * - Qiitaのほうが、前に書き戻した日時より新しければ、上書きしない(skip)。Qiitaで直したものを消さないため
 * - 中身が同じなら何もしない(同じ中身で更新すると日時だけ変わり、書き戻しがまた走る)
 */
export function plan(post, item) {
  if (!item) return { action: "create" };
  if (same(post, item)) {
    return post.id === item.id && post.updatedAt === item.updated_at
      ? { action: "none" }
      : { action: "record", item };
  }
  if (
    post.updatedAt === null ||
    Date.parse(item.updated_at) > Date.parse(post.updatedAt)
  )
    return {
      action: "skip",
      reason: "Qiitaのほうが新しく直されています。上書きしません",
    };
  return { action: "update" };
}

async function qiita(token, method, url, body) {
  const res = await fetch(API + url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Qiita ${method} ${url}: ${String(res.status)}`);
  return res.json();
}

/** 自分のQiitaの記事から、同じタイトルのものを探す */
async function findByTitle(token, title) {
  for (let page = 1; page <= 10; page++) {
    const items = await qiita(
      token,
      "GET",
      `/authenticated_user/items?page=${String(page)}&per_page=100`,
    );
    const found = items?.find((i) => i.title === title);
    if (found) return found;
    if (!items || items.length < 100) return null;
  }
  return null;
}

async function main() {
  const token = process.env.QIITA_TOKEN ?? "";
  if (token === "") {
    console.log("QIITA_TOKENがないので、Qiitaには出しません(docs/blog.md)");
    return;
  }
  const changed = new Set(
    (process.env.CHANGED ?? "").split("\n").filter(Boolean),
  );
  const web = fileURLToPath(new URL("..", import.meta.url));
  const root = path.join(web, "../..");
  const site = JSON.parse(
    readFileSync(path.join(web, ".content/site.json"), "utf8"),
  );
  for (const post of site.blog) {
    const file = `content/blog/${post.slug}.md`;
    if (!changed.has(file) || post.ignorePublish) continue;
    const item = post.id
      ? await qiita(token, "GET", `/items/${post.id}`)
      : await findByTitle(token, post.title);
    const step = plan(post, item);
    let result = null;
    if (step.action === "create")
      result = await qiita(token, "POST", "/items", toQiita(post));
    if (step.action === "update")
      result = await qiita(token, "PATCH", `/items/${post.id}`, toQiita(post));
    if (step.action === "record") result = step.item;
    if (step.action === "skip")
      console.log(`::warning file=${file}::${step.reason}`);
    console.log(`${file}: ${step.action}`);
    if (result) {
      const full = path.join(root, file);
      writeFileSync(
        full,
        writeBack(readFileSync(full, "utf8"), {
          id: result.id,
          updatedAt: result.updated_at,
        }),
      );
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
