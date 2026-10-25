// サイトの全部のページに、守りのヘッダーを書いた.htaccessを置く。ビルドのあとに走らせる。
// Next.jsはページにインラインのスクリプトを書き出すので、ページごとにそのハッシュだけをCSPで許す。
// .htaccessはページのディレクトリごとに置く(Apacheは近いディレクトリのものを使う)。
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
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

function htaccess(policy, admin) {
  return `# scripts/headers.mjsが書き出す。手で直さない
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "${policy}"
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "no-referrer"
  Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Cross-Origin-Resource-Policy "same-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
${admin ? '  Header always set Cache-Control "no-store"\n' : ""}</IfModule>
`;
}

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
  writeFileSync(path.join(dir, ".htaccess"), htaccess(policy, admin));
}
console.log(`${String(dirs.length)} 個のディレクトリに .htaccess を書き出した`);
