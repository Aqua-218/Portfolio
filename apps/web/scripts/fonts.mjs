// サイトで使っている文字だけのフォントを作り、全部のページに書き込む。ビルドのあと、headers.mjsの前に走らせる。
// Fontsourceのフォントは文字の範囲ごとに分かれていて、1ページで70ファイル・1.1MBも読んでいた。
// 書き出したページをChromiumで開き、どの書体のどの太さでどの文字を使っているかを集めて、太さごとに1ファイルにする。
// 日本語の元はGoogle Fontsと同じTTF(@expo-google-fonts、SIL OFL 1.1)。英数字(Geist)はFontsourceのもの。ビルドで外へ取りに行かない。
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { chromium } from "@playwright/test";
import subsetFont from "subset-font";

const require = createRequire(import.meta.url);
const out = new URL("../out/", import.meta.url).pathname;
const PORT = 4174;
const BASE = `http://localhost:${String(PORT)}`;

/** ページで使う書体。太さはtheme・各部品で使っているもの */
const FAMILIES = [
  {
    name: "Geist",
    slug: "geist",
    // 英数字だけなので、開発中と同じFontsourceのものから作る(字の幅まで同じになる)
    pkg: "@fontsource/geist",
    weights: {
      400: "files/geist-latin-400-normal.woff2",
      500: "files/geist-latin-500-normal.woff2",
      600: "files/geist-latin-600-normal.woff2",
      700: "files/geist-latin-700-normal.woff2",
      800: "files/geist-latin-800-normal.woff2",
    },
  },
  {
    name: "LINE Seed JP",
    slug: "line-seed-jp",
    // 日本語は字が多く大きいので、ページの順に分ける(下のsplit)
    split: true,
    subset: {
      // 横書きでブラウザが使う機能だけ残す。縦書きの形(vert)や旧字体(jp78)などの字形まで入れると1.5倍になる
      keepFeatures: [
        ...["ccmp", "locl", "rvrn", "rlig", "liga", "clig", "calt"],
        ...["kern", "mark", "mkmk"],
      ],
    },
    pkg: "@expo-google-fonts/line-seed-jp",
    weights: {
      400: "400Regular/LINESeedJP_400Regular.ttf",
      700: "700Bold/LINESeedJP_700Bold.ttf",
      800: "800ExtraBold/LINESeedJP_800ExtraBold.ttf",
    },
  },
];

/**
 * 字を分けるときのページの順。ナビの順で、最初に開かれやすいものから。
 * ここにないページ(イベント1件など)の字は、最後のまとまりに入る
 */
const ORDER = [
  "/",
  "/about/",
  "/skills/",
  "/work/",
  "/affiliations/",
  "/events/",
  "/shelf/",
  "/cats/",
  "/stack/",
  "/license/",
];

/** 新しく出てくる字がこれより少ないページは、ファイルを分けずに前のまとまりに入れる */
const MIN_GROUP = 40;

/** 先に読ませる(preload)もの。小さくて英数字の本文に使う。日本語のフォントは大きく、LCPの写真と取り合うので先に読ませない */
const PRELOAD = new Set(["geist-400"]);

/** 英数字と記号は、あとから出る文字(幕の文字など)のため、どの太さにも入れる */
const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i));

/**
 * ない太さのとき、ブラウザがどの太さを使うか(CSS Fontsの決まり)。
 * 400〜500は500までを上へ、次に下へ。500より太いものは上へ、次に下へ。400より細いものは下へ、次に上へ
 */
function pickWeight(want, have) {
  const sorted = [...have].sort((a, b) => a - b);
  const up = sorted.filter((w) => w >= want);
  const down = sorted.filter((w) => w < want).reverse();
  if (want >= 400 && want <= 500) {
    const near = up.filter((w) => w <= 500);
    return [...near, ...down, ...up.filter((w) => w > 500)][0];
  }
  if (want > 500) return [...up, ...down][0];
  const atOrBelow = sorted.filter((w) => w <= want).reverse();
  return [...atOrBelow, ...sorted.filter((w) => w > want)][0];
}

/** HTMLのあるページのURL */
function pages(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory())
      return e.name.startsWith("_next") ? [] : pages(path.join(dir, e.name));
    if (!e.name.endsWith(".html")) return [];
    const rel = path.relative(out, path.join(dir, e.name));
    return [`/${rel === "index.html" ? "" : rel.replace(/index\.html$/, "")}`];
  });
}

/** ページの文字を、書体の並び(font-family)と太さごとに集める。::before・::afterの文字も */
function collect() {
  const found = [];
  const add = (style, text) => {
    if (text)
      found.push({ family: style.fontFamily, weight: style.fontWeight, text });
  };
  const content = (style) => {
    const c = style.content;
    return c.startsWith('"') ? c.slice(1, -1) : "";
  };
  for (const el of document.querySelectorAll("*")) {
    const style = getComputedStyle(el);
    for (const node of el.childNodes)
      if (node.nodeType === Node.TEXT_NODE) add(style, node.data);
    for (const pseudo of ["::before", "::after", "::marker"]) {
      const ps = getComputedStyle(el, pseudo);
      add(ps, content(ps));
    }
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
      add(style, el.placeholder + el.value);
  }
  return found;
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(BASE);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("サーバーが立ち上がりません");
}

/** 書体と太さごとに、ページごとの字。キーは「slug-太さ」、その中はページのURLごと */
async function usedChars() {
  const server = spawn(process.execPath, ["e2e/serve.mjs"], {
    cwd: new URL("..", import.meta.url).pathname,
    env: { ...process.env, PORT: String(PORT) },
    stdio: "inherit",
  });
  const chars = new Map();
  const browser = await chromium.launch();
  try {
    await waitForServer();
    const page = await browser.newPage();
    for (const url of pages(out)) {
      await page.goto(BASE + url);
      for (const { family, weight, text } of await page.evaluate(collect)) {
        // 並びの中の書体を前から見る。Geistにない字(日本語)は次のLINE Seed JPで出るので、両方に入れる
        for (const name of family
          .split(",")
          .map((f) => f.trim().replace(/^"|"$/g, ""))) {
          const f = FAMILIES.find((x) => x.name === name);
          if (!f) continue;
          const w = pickWeight(
            Number(weight),
            Object.keys(f.weights).map(Number),
          );
          const key = `${f.slug}-${String(w)}`;
          const byPage = chars.get(key) ?? new Map();
          const set = byPage.get(url) ?? new Set();
          for (const ch of text) set.add(ch);
          byPage.set(url, set);
          chars.set(key, byPage);
          if (f.slug === "line-seed-jp") break;
        }
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
  return chars;
}

/**
 * 字をまとまりに分ける。ORDERの順にページを見て、そのページで初めて出てくる字を1つのまとまりにする。
 * ブラウザはunicode-rangeを見て、ページにある字のまとまりだけを読むので、Homeは自分の字の分だけで済む
 */
function groups(byPage, split) {
  const all = new Set([...byPage.values()].flatMap((set) => [...set]));
  if (!split) return [new Set([...ASCII, ...all])];
  const urls = [
    ...ORDER.filter((u) => byPage.has(u)),
    ...[...byPage.keys()].filter((u) => !ORDER.includes(u)).sort(),
  ];
  const seen = new Set(ASCII);
  const result = [new Set(ASCII)];
  for (const url of urls) {
    const fresh = [...(byPage.get(url) ?? [])].filter((ch) => !seen.has(ch));
    for (const ch of fresh) seen.add(ch);
    // ORDERにないページの字は、最後のまとまりにまとめる
    const last = result.length > 1 && !ORDER.includes(url);
    if (fresh.length >= MIN_GROUP && !last) result.push(new Set(fresh));
    else for (const ch of fresh) (result.at(-1) ?? result[0]).add(ch);
  }
  return result;
}

/** unicode-rangeの書き方。続いている字はまとめる */
function unicodeRange(set) {
  const cps = [...set]
    .map((ch) => ch.codePointAt(0) ?? 0)
    .sort((a, b) => a - b);
  const ranges = [];
  for (const cp of cps) {
    const r = ranges.at(-1);
    if (r && cp === r[1] + 1) r[1] = cp;
    else ranges.push([cp, cp]);
  }
  const hex = (n) => n.toString(16).toUpperCase();
  return ranges
    .map(([a, b]) => (a === b ? `U+${hex(a)}` : `U+${hex(a)}-${hex(b)}`))
    .join(",");
}

const chars = await usedChars();
const dir = path.join(out, "fonts");
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const faces = [];
for (const f of FAMILIES) {
  for (const [weight, file] of Object.entries(f.weights)) {
    const key = `${f.slug}-${weight}`;
    const byPage = chars.get(key);
    // 使っていない太さは作らない
    if (!byPage) continue;
    const ttf = readFileSync(require.resolve(`${f.pkg}/${file}`));
    for (const [i, set] of groups(byPage, f.split === true).entries()) {
      const woff2 = await subsetFont(ttf, [...set].join(""), {
        targetFormat: "woff2",
        ...f.subset,
      });
      const hash = createHash("sha256")
        .update(woff2)
        .digest("hex")
        .slice(0, 10);
      const name = `${key}-${String(i)}.${hash}.woff2`;
      writeFileSync(path.join(dir, name), woff2);
      faces.push({
        family: f.name,
        weight,
        key,
        href: `/fonts/${name}`,
        range: f.split === true ? unicodeRange(set) : undefined,
      });
      console.log(
        `${name}: ${String(set.size)} 字, ${String(Math.round(woff2.length / 1024))} KB`,
      );
    }
  }
}

const css = faces
  .map(
    (f) =>
      `@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};font-display:swap;src:url(${f.href}) format("woff2")${f.range ? `;unicode-range:${f.range}` : ""}}`,
  )
  .join("");
const head = [
  ...faces
    .filter((f) => PRELOAD.has(f.key))
    .map(
      (f) =>
        `<link rel="preload" href="${f.href}" as="font" type="font/woff2" crossorigin="">`,
    ),
  `<style>${css}</style>`,
].join("");

for (const url of pages(out)) {
  const file = path.join(out, url.endsWith("/") ? `${url}index.html` : url);
  const html = readFileSync(file, "utf8");
  writeFileSync(file, html.replace("</head>", `${head}</head>`));
}
console.log(`${String(faces.length)} 個のフォントを作り、ページに書き込んだ`);
