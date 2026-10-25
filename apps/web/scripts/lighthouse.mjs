// ビルドしたout/をe2eのサーバー(本番と同じヘッダーと圧縮)で出し、おもなページをLighthouseで測る。
// 予算を超えたら落とす。レポートは.lighthouse/に書き出す。
// スマホ(遅い回線と遅いCPU)の条件で測る。Lighthouseの既定で、PCより厳しい。
// 本番(Cloudflare)と同じくHTTPSのHTTP/2で出す。証明書はその場で作る自己署名のもの。
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";

const PORT = 4173;
const BASE = `https://localhost:${String(PORT)}`;
const PAGES = ["/", "/about/", "/events/", "/cats/", "/stack/"];
// ゆれを減らすため、3回測って真ん中を使う
const RUNS = 3;
const out = new URL("../.lighthouse/", import.meta.url).pathname;

/**
 * 予算。目標(goal)に届かなければ知らせ、下限(limit)を超えたら落とす。
 * CIのマシンによって、CPUの重さで点が少しゆれるので、落とす線は目標より少し緩くしてある。
 */
const BUDGETS = [
  ...["performance", "accessibility", "best-practices", "seo"].map((id) => ({
    name: `${id}の点`,
    value: (lhr) => lhr.categories[id].score,
    higher: true,
    goal: 0.95,
    limit: id === "performance" ? 0.9 : 0.95,
  })),
  {
    name: "LCP(ms)",
    value: (lhr) => lhr.audits["largest-contentful-paint"].numericValue,
    goal: 2500,
    limit: 3000,
  },
  {
    name: "CLS",
    value: (lhr) => lhr.audits["cumulative-layout-shift"].numericValue,
    goal: 0.05,
    limit: 0.05,
  },
  {
    name: "TBT(ms)",
    value: (lhr) => lhr.audits["total-blocking-time"].numericValue,
    goal: 200,
    limit: 300,
  },
  // 大きさは転送量(バイト)
  {
    name: "JSの大きさ",
    value: (lhr) => transfer(lhr, "Script"),
    goal: 250_000,
    limit: 250_000,
  },
  {
    name: "CSSの大きさ",
    value: (lhr) => transfer(lhr, "Stylesheet"),
    goal: 30_000,
    limit: 30_000,
  },
  {
    name: "フォントの大きさ",
    value: (lhr) => transfer(lhr, "Font"),
    // 字の多いページ(Stackなど)は、ページの順に分けたフォントをいくつも読むので、下限は広めに
    goal: 150_000,
    limit: 300_000,
  },
];

function transfer(lhr, type) {
  return lhr.audits["network-requests"].details.items
    .filter((i) => i.resourceType === type)
    .reduce((sum, i) => sum + i.transferSize, 0);
}

/** その場で作る自己署名の証明書。測るChromiumはこの証明書の間違いを見ない */
function certificate(dir) {
  const key = path.join(dir, "key.pem");
  const cert = path.join(dir, "cert.pem");
  execFileSync(
    "openssl",
    [
      ...[
        "req",
        "-x509",
        "-newkey",
        "ec",
        "-pkeyopt",
        "ec_paramgen_curve:prime256v1",
      ],
      ...["-nodes", "-days", "1", "-subj", "/CN=localhost"],
      ...["-keyout", key, "-out", cert],
    ],
    { stdio: "ignore" },
  );
  return { key, cert };
}

/** サーバーがポートを開くまで待つ */
async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    const open = await new Promise((resolve) => {
      const socket = connect(PORT, "localhost", () => {
        socket.end();
        resolve(true);
      });
      socket.on("error", () => {
        resolve(false);
      });
    });
    if (open) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("e2eのサーバーが立ち上がりません");
}

/** 1回測る。毎回新しいChromiumで、キャッシュのない状態から */
async function measure(url) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const browser = await chromium.launch({
    // headless shellではなく、本物のChromiumで測る
    channel: "chromium",
    args: [
      `--remote-debugging-port=${String(port)}`,
      "--ignore-certificate-errors",
    ],
  });
  try {
    const result = await lighthouse(url, {
      port,
      output: "html",
      logLevel: "error",
    });
    if (!result) throw new Error(`${url}を測れませんでした`);
    return result;
  } finally {
    await browser.close();
  }
}

const tls = mkdtempSync(path.join(tmpdir(), "lighthouse-"));
const { key, cert } = certificate(tls);
const server = spawn(process.execPath, ["e2e/serve.mjs"], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, PORT: String(PORT), TLS_KEY: key, TLS_CERT: cert },
  stdio: "inherit",
});

let failed = false;
try {
  await waitForServer();
  mkdirSync(out, { recursive: true });
  for (const page of PAGES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await measure(BASE + page));
    // 性能の点が真ん中の回
    runs.sort(
      (a, b) =>
        (a.lhr.categories.performance.score ?? 0) -
        (b.lhr.categories.performance.score ?? 0),
    );
    const { lhr, report } = runs[Math.floor(RUNS / 2)];
    const name = page === "/" ? "home" : page.replaceAll("/", "");
    writeFileSync(`${out}${name}.html`, report);
    writeFileSync(`${out}${name}.json`, JSON.stringify(lhr));

    console.log(`\n${page}`);
    for (const b of BUDGETS) {
      const value = b.value(lhr);
      const within = (line) => (b.higher ? value >= line : value <= line);
      const sign = b.higher ? ">=" : "<=";
      const mark = within(b.goal) ? "ok  " : within(b.limit) ? "warn" : "NG  ";
      console.log(
        `  ${mark} ${b.name}: ${String(Math.round(value * 1000) / 1000)} (目標 ${sign} ${String(b.goal)}、下限 ${sign} ${String(b.limit)})`,
      );
      if (!within(b.limit)) failed = true;
    }
  }
} finally {
  server.kill();
  rmSync(tls, { recursive: true, force: true });
}

if (failed) {
  console.error(
    "\n予算を超えたものがあります。レポートは.lighthouse/にあります。",
  );
  process.exit(1);
}
