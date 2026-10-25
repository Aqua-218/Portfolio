// out/を配信する小さな静的サーバー。e2eテストで使う。
import { createReadStream, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createSecureServer } from "node:http2";
import { dirname, extname, join, normalize } from "node:path";
import { brotliCompressSync, gzipSync } from "node:zlib";

const root = new URL("../out/", import.meta.url).pathname;
const port = Number(process.env.PORT ?? 4173);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
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

/** 文字のファイルは、本番(Cloudflare・ロリポップ)と同じく縮めて送る。Lighthouseで本番に近い大きさを測るため */
const compressible = new Set([".html", ".js", ".css", ".svg", ".txt", ".wasm"]);

/** 縮めたものは覚えておく。毎回brotliで縮めると、e2eを並べて走らせたときに遅くなる */
const compressed = new Map();

function compress(file, encoding) {
  const key = `${encoding}:${file}`;
  let body = compressed.get(key);
  if (!body) {
    const raw = readFileSync(file);
    body = encoding === "br" ? brotliCompressSync(raw) : gzipSync(raw);
    compressed.set(key, body);
  }
  return body;
}

function send(req, res, status, file, headers) {
  const accept = String(req.headers["accept-encoding"] ?? "");
  const encoding = !compressible.has(extname(file))
    ? undefined
    : /\bbr\b/.test(accept)
      ? "br"
      : /\bgzip\b/.test(accept)
        ? "gzip"
        : undefined;
  res.writeHead(status, {
    ...headers,
    vary: "accept-encoding",
    ...(encoding ? { "content-encoding": encoding } : {}),
  });
  if (encoding) res.end(compress(file, encoding));
  else createReadStream(file).pipe(res);
}

/**
 * TLS_KEYとTLS_CERTがあれば、本番(Cloudflare)と同じくHTTPSのHTTP/2で出す。Lighthouseで使う。
 * HTTP/1.1だと、ファイルごとに接続を取り合うものとして見積もられ、本番よりずっと遅く出る
 */
function serve(handler) {
  const { TLS_KEY, TLS_CERT } = process.env;
  return TLS_KEY && TLS_CERT
    ? createSecureServer(
        {
          allowHTTP1: true,
          key: readFileSync(TLS_KEY),
          cert: readFileSync(TLS_CERT),
        },
        handler,
      )
    : createServer(handler);
}

serve((req, res) => {
  const { pathname } = new URL(req.url ?? "/", "http://localhost");
  const file = resolve(pathname);
  if (!file) {
    const page = join(root, "404.html");
    send(req, res, 404, page, {
      ...htaccessHeaders(page),
      "content-type": types[".html"],
    });
    return;
  }
  send(req, res, 200, file, {
    ...htaccessHeaders(file),
    "content-type": types[extname(file)] ?? "application/octet-stream",
  });
}).listen(port);
