// 開発モード(pnpm dev)の管理画面の相手。WorkerとGitHubの代わりに、手元のcontent/を読み書きする。
// 本番には入らない。Workerには手を入れない(ログインを飛ばす道は、ここ=手元にしかない)。
// - ログインはいらない(いつも「dev」でログインしている)
// - mainはディスクのcontent/。下書き(draft/)は apps/web/.dev/admin.json に置く
// - 公開(PRのマージ)すると、下書きをディスクのcontent/に書く。チェックはすぐ通る
// - Qiitaにも出さない。出した記事は apps/web/.dev/admin.json に置く
// 管理画面が使うGitHub APIだけを、同じ形で返す。127.0.0.1でしか待たない
import { createHash, randomBytes } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.DEV_ADMIN_PORT ?? 4300);
const REPO = "/repos/Aqua-218/Portfolio/";
const root = fileURLToPath(new URL("../../../", import.meta.url));
const storeFile = fileURLToPath(new URL("../.dev/admin.json", import.meta.url));

/** 下書き・blob・tree・commit・PR。再起動しても残す */
function load() {
  try {
    return JSON.parse(readFileSync(storeFile, "utf8"));
  } catch {
    return { drafts: {}, objects: {}, pulls: [], next: 1, qiita: {} };
  }
}
let store = load();
store.qiita ??= {};
function save() {
  mkdirSync(path.dirname(storeFile), { recursive: true });
  writeFileSync(storeFile, JSON.stringify(store, null, 2));
}

const sha = (data) => createHash("sha1").update(data).digest("hex");

/** content/の中のパスか(外は読み書きさせない) */
function safe(p) {
  const full = path.normalize(path.join(root, p));
  return (
    p.startsWith("content/") &&
    !p.includes("..") &&
    full.startsWith(path.join(root, "content") + path.sep)
  );
}

function walk(dir) {
  return readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(
    (e) => {
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) return rel === "content/.cache" ? [] : walk(rel);
      return [rel];
    },
  );
}

/** ブランチにあるファイル。下書きになければmain(ディスク) */
function fileAt(ref, p) {
  if (!safe(p)) return undefined;
  const draft = store.drafts[ref];
  if (draft && p in draft.files) {
    const v = draft.files[p];
    return v === null ? undefined : Buffer.from(v, "base64");
  }
  if (ref !== "main" && !draft) return undefined;
  try {
    return statSync(path.join(root, p)).isFile()
      ? readFileSync(path.join(root, p))
      : undefined;
  } catch {
    return undefined;
  }
}

/** オブジェクト(blob・tree・commit)をしまって、そのshaを返す */
function put(kind, value) {
  const id = sha(`${kind}:${JSON.stringify(value)}:${String(store.next++)}`);
  store.objects[id] = { kind, value };
  return id;
}

async function body(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString("utf8");
  return text === "" ? {} : JSON.parse(text);
}

function send(res, status, data) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

/** GitHub APIの代わり。pathは /repos/Aqua-218/Portfolio/ からあと */
async function github(method, full, req) {
  const url = new URL(full, "http://dev");
  if (!url.pathname.startsWith(REPO))
    return [403, { error: "その操作はできません" }];
  const p = url.pathname.slice(REPO.length);
  const q = url.searchParams;
  let m;

  if (method === "GET" && p === "git/trees/main")
    return [
      200,
      { tree: walk("content").map((f) => ({ path: f, type: "blob" })) },
    ];

  if (method === "GET" && p === "git/matching-refs/heads/draft/")
    return [
      200,
      Object.keys(store.drafts).map((b) => ({ ref: `refs/heads/${b}` })),
    ];

  if (method === "GET" && (m = /^git\/ref\/heads\/(.+)$/.exec(p))) {
    if (m[1] === "main") return [200, { object: { sha: "main" } }];
    const d = store.drafts[m[1]];
    return d ? [200, { object: { sha: d.head } }] : [404, {}];
  }
  if (method === "POST" && p === "git/refs") {
    const b = await body(req);
    const branch = String(b.ref).replace(/^refs\/heads\//, "");
    if (!branch.startsWith("draft/")) return [403, {}];
    store.drafts[branch] = { head: b.sha, files: {} };
    save();
    return [201, {}];
  }
  if (method === "PATCH" && (m = /^git\/refs\/heads\/(draft\/.+)$/.exec(p))) {
    const b = await body(req);
    const d = store.drafts[m[1]];
    const commit = store.objects[b.sha];
    if (!d || commit?.kind !== "commit") return [422, {}];
    const tree = store.objects[commit.value.tree];
    for (const e of tree?.value.tree ?? []) {
      const blob = store.objects[e.sha];
      if (safe(e.path) && blob?.kind === "blob") d.files[e.path] = blob.value;
    }
    d.head = b.sha;
    save();
    return [200, {}];
  }
  if (method === "GET" && (m = /^contents\/(.+)$/.exec(p))) {
    const ref = q.get("ref") ?? "main";
    const data = fileAt(ref, m[1]);
    if (!data) return [404, {}];
    const content = data.toString("base64");
    return [200, { content, sha: sha(data), encoding: "base64" }];
  }
  if (method === "PUT" && (m = /^contents\/(.+)$/.exec(p))) {
    const b = await body(req);
    const d = store.drafts[b.branch];
    if (!d || !safe(m[1])) return [404, {}];
    d.files[m[1]] = b.content;
    d.head = sha(`${d.head}:${m[1]}:${b.content}`);
    save();
    return [200, { content: { path: m[1] } }];
  }
  if (method === "POST" && p === "git/blobs") {
    const b = await body(req);
    const data =
      b.encoding === "base64"
        ? b.content
        : Buffer.from(b.content).toString("base64");
    const id = put("blob", data);
    save();
    return [201, { sha: id }];
  }
  if (method === "GET" && (m = /^git\/blobs\/(\w+)$/.exec(p))) {
    const blob = store.objects[m[1]];
    if (blob?.kind === "blob") return [200, { content: blob.value }];
    // ディスクのファイルのsha(contentsで返したもの)
    for (const f of walk("content")) {
      const data = readFileSync(path.join(root, f));
      if (sha(data) === m[1])
        return [200, { content: data.toString("base64") }];
    }
    for (const d of Object.values(store.drafts))
      for (const v of Object.values(d.files))
        if (v && sha(Buffer.from(v, "base64")) === m[1])
          return [200, { content: v }];
    return [404, {}];
  }
  if (method === "GET" && (m = /^git\/commits\/(\w+)$/.exec(p)))
    return [200, { tree: { sha: `tree-of-${m[1]}` } }];
  if (method === "POST" && p === "git/trees") {
    const id = put("tree", await body(req));
    save();
    return [201, { sha: id }];
  }
  if (method === "POST" && p === "git/commits") {
    const id = put("commit", await body(req));
    save();
    return [201, { sha: id }];
  }
  if (method === "GET" && p === "pulls")
    return [200, store.pulls.filter((x) => x.state === "open")];
  if (method === "POST" && p === "pulls") {
    const b = await body(req);
    const d = store.drafts[b.head];
    if (!d) return [422, {}];
    const pull = {
      number: store.next++,
      title: b.title,
      state: "open",
      html_url: "/admin/",
      head: { ref: b.head, sha: d.head },
    };
    store.pulls.push(pull);
    save();
    return [201, pull];
  }
  if (method === "GET" && /^commits\/\w+\/check-runs$/.test(p))
    return [
      200,
      {
        check_runs: [
          {
            name: "開発モード(チェックなし)",
            status: "completed",
            conclusion: "success",
          },
        ],
      },
    ];
  if (method === "PUT" && (m = /^pulls\/(\d+)\/merge$/.exec(p))) {
    const pull = store.pulls.find((x) => x.number === Number(m[1]));
    const d = pull && store.drafts[pull.head.ref];
    if (!pull || !d) return [404, {}];
    // 公開: 下書きをディスクのcontent/に書く
    for (const [f, v] of Object.entries(d.files)) {
      if (!safe(f) || v === null) continue;
      mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
      writeFileSync(path.join(root, f), Buffer.from(v, "base64"));
    }
    pull.state = "closed";
    store.drafts = Object.fromEntries(
      Object.entries(store.drafts).filter(([b]) => b !== pull.head.ref),
    );
    save();
    return [200, { sha: `merged-${String(pull.number)}`, merged: true }];
  }
  if (method === "GET" && p === "actions/runs")
    return [
      200,
      {
        workflow_runs: [
          {
            name: "開発モード(公開はcontent/に書いた)",
            status: "completed",
            conclusion: "success",
          },
        ],
      },
    ];
  return [404, { error: "開発モードでは、まだ使えません" }];
}

/** いまの日時。Qiitaが返す形(+09:00) */
function now() {
  const t = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 19);
  return `${t}+09:00`;
}

/** Qiita APIの代わり。pathは /api/v2/ から */
async function qiita(method, full, req) {
  const url = new URL(full, "http://dev");
  const p = url.pathname;
  let m;
  if (method === "GET" && p === "/api/v2/authenticated_user/items") {
    const page = Number(url.searchParams.get("page") ?? 1);
    const per = Number(url.searchParams.get("per_page") ?? 20);
    const items = Object.values(store.qiita).sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    return [200, items.slice((page - 1) * per, page * per)];
  }
  if ((m = /^\/api\/v2\/items\/([0-9a-f]{20})$/.exec(p))) {
    const item = store.qiita[m[1]];
    if (!item) return [404, { message: "Not found" }];
    if (method === "GET") return [200, item];
    if (method === "PATCH") {
      Object.assign(item, await body(req), { updated_at: now() });
      save();
      return [200, item];
    }
  }
  if (method === "POST" && p === "/api/v2/items") {
    const id = randomBytes(10).toString("hex");
    const at = now();
    const item = {
      ...(await body(req)),
      id,
      created_at: at,
      updated_at: at,
      url: `https://qiita.com/dev/items/${id}`,
    };
    store.qiita[id] = item;
    save();
    return [201, item];
  }
  return [403, { error: "その操作はできません" }];
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://dev");
  const route = url.pathname.replace(/\/$/, "");
  void (async () => {
    try {
      if (route === "/admin/auth/me") return send(res, 200, { login: "dev" });
      if (route === "/admin/auth/login") {
        res.writeHead(303, { location: "/admin/" });
        return res.end();
      }
      if (route === "/admin/auth/logout") return send(res, 200, { ok: true });
      if (route === "/admin/api") {
        const [status, data] = await github(
          req.method ?? "GET",
          url.searchParams.get("path") ?? "",
          req,
        );
        return send(res, status, data);
      }
      if (route === "/admin/qiita") {
        const [status, data] = await qiita(
          req.method ?? "GET",
          url.searchParams.get("path") ?? "",
          req,
        );
        return send(res, status, data);
      }
      send(res, 404, {});
    } catch (e) {
      send(res, 500, { error: String(e) });
    }
  })();
}).listen(PORT, "127.0.0.1", () => {
  console.log(`開発モードの管理画面の相手: http://127.0.0.1:${String(PORT)}`);
});
