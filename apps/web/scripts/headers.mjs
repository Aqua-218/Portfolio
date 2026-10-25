// サイトの全部のページに、守りのヘッダーを書いた.htaccessを置く。ビルドのあとに走らせる。
// Next.jsはページにインラインのスクリプトを書き出すので、ページごとにそのハッシュだけをCSPで許す。
// .htaccessはページのディレクトリごとに置く(Apacheは近いディレクトリのものを使う)。
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const out = new URL("../out/", import.meta.url).pathname;

/** src のない <script> の中身のハッシュ */
function scriptHashes(html) {
  return [
    ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
  ].map(
    ([, body = ""]) =>
      `'sha256-${createHash("sha256").update(body).digest("base64")}'`,
  );
}

/** HTMLの文字参照を戻す。SVGの中の<style>は、戻した中身でハッシュされる */
function decode(text) {
  return text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&amp;", "&");
}

/** <style> の中身のハッシュ(Mermaidの図のSVGの中にある) */
function styleHashes(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(
    ([, body = ""]) =>
      `'sha256-${createHash("sha256").update(decode(body)).digest("base64")}'`,
  );
}

/** 外から読む画像(リンクカードのOGPの画像)の出どころ */
function imageOrigins(html) {
  return [...html.matchAll(/<img[^>]*\bsrc="(https:\/\/[^"/]+)/g)].map(
    ([, origin = ""]) => origin,
  );
}

/** ページのCSP。管理画面だけ、ログインのフォームがGitHubへ移る */
export function csp({ hashes, styles, images, admin }) {
  return [
    "default-src 'none'",
    // ドット猫と検証はWebAssemblyなので、Wasmの読み込みだけ許す(evalは許さない)
    `script-src 'self' 'wasm-unsafe-eval' ${[...new Set(hashes)].join(" ")}`.trim(),
    // 見た目はCSSのファイル。Mermaidの図の<style>はハッシュで、要素のstyle属性(ドット猫の大きさなど)はインラインで許す
    `style-src 'self' ${[...new Set(styles)].join(" ")}`.trim(),
    "style-src-attr 'unsafe-inline'",
    `img-src 'self' data: ${[...new Set(images)].sort().join(" ")}`.trim(),
    "font-src 'self'",
    // 通信は自分のサイト(次のページの読み込みと、管理画面のWorker)だけ
    "connect-src 'self'",
    admin ? "form-action 'self' https://github.com" : "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "manifest-src 'self'",
  ].join("; ");
}

/** エラーのページがある番号(src/app/errors/[code]) */
const ERRORS = [
  "400",
  "401",
  "403",
  "408",
  "410",
  "429",
  "500",
  "502",
  "503",
  "504",
];

/** サイトのいちばん上(out/)の.htaccessにだけ書くもの。下のディレクトリにも効く */
const ROOT = `# 見つからないページと、エラーのページ
ErrorDocument 404 /404.html
${ERRORS.map((code) => `ErrorDocument ${code} /errors/${code}/`).join("\n")}

# HTTPSにする。Cloudflareを前に置いたときは、Cloudflareとの間がHTTPでも転送しない(X-Forwarded-Proto)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteCond %{HTTP:X-Forwarded-Proto} !^https$ [NC]
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
  # ディレクトリの最後の/は、ここでHTTPSのまま足す。Apacheに任せる(DirectorySlash)と、Cloudflareの後ろでは http:// で返す
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^(.*[^/])$ https://%{HTTP_HOST}/$1/ [R=301,L]
</IfModule>
# ファイルの一覧は出さない
Options -Indexes

# 古いApacheが知らない種類
<IfModule mod_mime.c>
  AddType application/wasm .wasm
  AddType font/woff2 .woff2
  AddType image/avif .avif
  AddType image/webp .webp
  AddCharset utf-8 .html .txt .css .js .json .svg .xml
</IfModule>

# OGPの画像は拡張子がない(Next.jsのopengraph-image)
<FilesMatch "^opengraph-image$">
  ForceType image/png
</FilesMatch>

# 文字のファイルは縮めて送る
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/javascript application/javascript application/json application/wasm application/xml image/svg+xml
</IfModule>

`;

function htaccess(policy, admin, root) {
  return `# scripts/headers.mjsが書き出す。手で直さない
${root ? ROOT : ""}<IfModule mod_headers.c>
  Header always set Content-Security-Policy "${policy}"
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "no-referrer"
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Cross-Origin-Resource-Policy "same-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
  # ページは毎回、変わっていないか確かめる。管理画面は残さない
  Header always set Cache-Control "${admin ? "no-store" : "no-cache"}"
</IfModule>
`;
}

/** 名前に中身のハッシュが入るファイルの置き場。中身が変われば名前も変わるので、1年持たせて確かめもしない */
const IMMUTABLE = ["_next/static", "img/cats", "fonts"];

const immutable = `# scripts/headers.mjsが書き出す。手で直さない
# ここのファイルは名前に中身のハッシュが入る
<IfModule mod_headers.c>
  Header always set Cache-Control "public, max-age=31536000, immutable"
</IfModule>
`;

/** HTMLのあるディレクトリ(_next/など、ページのないところは除く) */
function pageDirs(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const here = entries.some((e) => e.isFile() && e.name.endsWith(".html"))
    ? [dir]
    : [];
  return [
    ...here,
    ...entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("_next"))
      .flatMap((e) => pageDirs(path.join(dir, e.name))),
  ];
}

const dirs = pageDirs(out).map((dir) => ({
  dir,
  htmls: readdirSync(dir)
    .filter((f) => f.endsWith(".html"))
    .map((f) => readFileSync(path.join(dir, f), "utf8")),
}));

// ページの中で移ると(幕のあとのrouter.push)、ドキュメントは最初のページのまま、CSPも最初のページのものが効く。
// 移った先の図の<style>や、リンクカードの画像が止められないよう、この2つはサイト全体の分を全ページに入れる。
// インラインのスクリプトは、ページの中で移っても動かさないので、ページごとでいい
const styles = dirs.flatMap((d) => d.htmls.flatMap(styleHashes));
const images = dirs.flatMap((d) => d.htmls.flatMap(imageOrigins));

for (const { dir, htmls } of dirs) {
  const admin = path.relative(out, dir).split(path.sep)[0] === "admin";
  const policy = csp({
    hashes: htmls.flatMap(scriptHashes),
    styles,
    images,
    admin,
  });
  writeFileSync(
    path.join(dir, ".htaccess"),
    htaccess(policy, admin, dir === out),
  );
}
for (const rel of IMMUTABLE) {
  const dir = path.join(out, rel);
  if (existsSync(dir)) writeFileSync(path.join(dir, ".htaccess"), immutable);
}
console.log(`${String(dirs.length)} 個のディレクトリに .htaccess を書き出した`);
