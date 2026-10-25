// 管理画面(out/admin/)に、守りのヘッダーを書いた.htaccessを置く。ビルドのあとに走らせる。
// Next.jsはページにインラインのスクリプトを書き出すので、そのハッシュだけをCSPで許す。
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const dir = new URL("../out/admin/", import.meta.url);
const html = readFileSync(new URL("index.html", dir), "utf8");

/** src のない <script> の中身のハッシュ */
const hashes = [
  ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g),
].map(
  ([, body = ""]) =>
    `'sha256-${createHash("sha256").update(body).digest("base64")}'`,
);

export const csp = [
  "default-src 'none'",
  `script-src 'self' ${[...new Set(hashes)].join(" ")}`,
  // 見た目はCSSのファイル。要素のstyle属性(ドット猫の大きさなど)だけインラインを許す
  "style-src 'self'",
  "style-src-attr 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  // 通信は自分のサイト(Workerを含む)だけ
  "connect-src 'self'",
  // ログインのフォームはWorkerを通ってGitHubへ移る
  "form-action 'self' https://github.com",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join("; ");

const htaccess = `# scripts/admin-headers.mjsが書き出す。手で直さない
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "${csp}"
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "no-referrer"
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  Header always set Cache-Control "no-store"
</IfModule>
`;

writeFileSync(new URL(".htaccess", dir), htaccess);
console.log(
  `out/admin/.htaccess を書き出した(インラインのスクリプト ${String(hashes.length)} 個)`,
);
