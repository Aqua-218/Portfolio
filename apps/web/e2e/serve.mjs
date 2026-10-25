// out/を配信する小さな静的サーバー。e2eテストで使う。
import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";

const root = new URL("../out/", import.meta.url).pathname;
const port = Number(process.env.PORT ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function resolve(pathname) {
  const path = normalize(join(root, decodeURIComponent(pathname)));
  if (!path.startsWith(root)) return undefined;
  for (const candidate of [path, join(path, "index.html")]) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // 次の候補を見る
    }
  }
  return undefined;
}

/**
 * そのファイルに効く.htaccessのヘッダー(Header always set 名前 "値")。
 * Apacheと同じく、out/から順に下のディレクトリのもので上書きする。本番(ロリポップ)と同じヘッダーでe2eを走らせる
 */
function htaccessHeaders(file) {
  const headers = {};
  const rel = dirname(file).slice(root.length).split("/").filter(Boolean);
  for (let i = 0; i <= rel.length; i++) {
    try {
      const text = readFileSync(
        join(root, ...rel.slice(0, i), ".htaccess"),
        "utf8",
      );
      for (const [, k, v] of text.matchAll(
        /^\s*Header always set (\S+) "(.*)"\s*$/gm,
      )) {
        headers[k] = v;
      }
    } catch {
      // このディレクトリにはない
    }
  }
  return headers;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const file = resolve(pathname);
  if (!file) {
    res.writeHead(404, {
      ...htaccessHeaders(join(root, "404.html")),
      "content-type": types[".html"],
    });
    createReadStream(join(root, "404.html")).pipe(res);
    return;
  }
  res.writeHead(200, {
    ...htaccessHeaders(file),
    "content-type": types[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}).listen(port);
