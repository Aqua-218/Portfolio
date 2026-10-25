// out/を出しているApacheに聞いて、.htaccess(scripts/headers.mjs)が思ったとおりに効いているか確かめる。apache/run.shから走らせる。
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { request } from "node:http";
import { test } from "node:test";

const base = process.env.APACHE ?? "http://127.0.0.1:4180";
const out = new URL("../out/", import.meta.url).pathname;
/** Cloudflareを通ってきたことにする(Cloudflareとの間はHTTPでもよい) */
const https = { "x-forwarded-proto": "https" };

function get(path, headers = https) {
  return fetch(base + path, { headers, redirect: "manual" });
}

/** out/の中で、最初に見つかったファイル */
function first(dir, ext) {
  const name = readdirSync(out + dir).find((f) => f.endsWith(ext));
  assert.ok(name, `${dir}に${ext}がない`);
  return `/${dir}/${name}`;
}

test("HTTPでくればHTTPSへ移す", async () => {
  const res = await get("/about/?x=1", {});
  assert.equal(res.status, 301);
  assert.match(
    res.headers.get("location") ?? "",
    /^https:\/\/[^/]+\/about\/\?x=1$/,
  );
});

test("ディレクトリの最後の/は、HTTPSのまま足す", async () => {
  const res = await get("/about");
  assert.equal(res.status, 301);
  assert.match(res.headers.get("location") ?? "", /^https:\/\/[^/]+\/about\/$/);
});

test("ページには守りのヘッダーがつき、毎回確かめる", async () => {
  const res = await get("/");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("content-type"), "text/html; charset=utf-8");
  assert.match(
    res.headers.get("content-security-policy") ?? "",
    /^default-src 'none'/,
  );
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.match(
    res.headers.get("strict-transport-security") ?? "",
    /max-age=63072000/,
  );
  assert.equal(res.headers.get("cache-control"), "no-cache");
});

test("ないページは404で、404のページを出す", async () => {
  for (const path of ["/nai/", "/about/nai", "/events/nai/x.html"]) {
    const res = await get(path);
    assert.equal(res.status, 404, path);
    assert.match(await res.text(), /<title>404 \|/, path);
    assert.match(
      res.headers.get("content-security-policy") ?? "",
      /^default-src 'none'/,
    );
  }
});

test("ファイルの一覧は出さない(エラーのページになる)", async () => {
  const res = await get("/img/cats/");
  assert.equal(res.status, 403);
  assert.match(await res.text(), /<title>403 \|/);
});

test("管理画面は残さない", async () => {
  const res = await get("/admin/");
  assert.equal(res.headers.get("cache-control"), "no-store");
});

test("ファイルの種類と、名前にハッシュの入るものの長いキャッシュ", async () => {
  const immutable = "public, max-age=31536000, immutable";
  const cases = [
    [first("_next/static/chunks", ".js"), /^text\/javascript/, immutable],
    [first("_next/static/chunks", ".css"), /^text\/css/, immutable],
    [first("_next/static/media", ".wasm"), /^application\/wasm$/, immutable],
    [first("fonts", ".woff2"), /^font\/woff2$/, immutable],
    [first("img/cats", ".avif"), /^image\/avif$/, immutable],
    [first("img/cats", ".webp"), /^image\/webp$/, immutable],
    ["/opengraph-image", /^image\/png$/, "no-cache"],
    ["/favicon.ico", /^image\/(x-icon|vnd\.microsoft\.icon)$/, "no-cache"],
    ["/icon.svg", /^image\/svg\+xml/, "no-cache"],
    ["/blog/feed.xml", /^application\/atom\+xml/, "no-cache"],
  ];
  for (const [path, type, cache] of cases) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get("content-type") ?? "", type, path);
    assert.equal(res.headers.get("cache-control"), cache, path);
  }
});

test("文字のファイルは縮めて送る", async () => {
  const res = await get(first("_next/static/chunks", ".js"), {
    ...https,
    "accept-encoding": "gzip",
  });
  assert.equal(res.headers.get("content-encoding"), "gzip");
});

test("www.komineko.jpはkomineko.jpへ移す", async () => {
  // fetchはHostを変えられないので、httpで聞く
  const res = await new Promise((resolve, reject) => {
    const u = new URL(base);
    request(
      {
        host: u.hostname,
        port: u.port,
        path: "/about/?x=1",
        headers: { ...https, host: "www.komineko.jp" },
      },
      resolve,
    )
      .on("error", reject)
      .end();
  });
  res.resume();
  assert.equal(res.statusCode, 301);
  assert.equal(res.headers.location, "https://komineko.jp/about/?x=1");
});

test("Let's Encryptの確認のパスは、HTTPでもwwwでも転送しない", async () => {
  const res = await new Promise((resolve, reject) => {
    const u = new URL(base);
    request(
      {
        host: u.hostname,
        port: u.port,
        path: "/.well-known/acme-challenge/test-token",
        headers: { host: "www.komineko.jp" },
      },
      resolve,
    )
      .on("error", reject)
      .end();
  });
  res.resume();
  // ロリポップが置くファイルがないので404。転送(301)にならないこと
  assert.equal(res.statusCode, 404);
});

test("HTTPでないページを開いても、404のページのURLへは移さない", async () => {
  const res = await get("/nai/", {});
  // HTTPSへ移すのは、頼まれたURLのまま
  if (res.status === 301)
    assert.match(res.headers.get("location") ?? "", /\/nai\/$/);
  else assert.equal(res.status, 404);
});
