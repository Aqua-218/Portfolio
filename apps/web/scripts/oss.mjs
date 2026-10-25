// サイトのコードが使っているライブラリと、そのライセンスの原文を集めて .content/oss.json に書く。ビルドの前に走らせる。
// - npm: @portfolio/web と、それが使うワークスペースのパッケージの本番の依存(pnpm licenses list --prod)
// - Rust: WebAssemblyにするクレート(pxcat-wasm・content-wasm)の依存(cargo metadata)
// 原文は各パッケージに入っているLICENSEなどを使う。入っていなければ、SPDXの原文(content/licenses/)を使う。
// 同じ原文は1つにまとめ、/license/<id>/ で読めるようにする
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const web = fileURLToPath(new URL("..", import.meta.url));
const root = path.join(web, "../..");
const licensesDir = path.join(root, "content/licenses");

/** WebAssemblyにして、ブラウザで動かすクレート */
const WASM_CRATES = ["pxcat-wasm", "content-wasm"];

/** SPDXの識別子から、content/licenses/ の原文のid */
const SPDX = {
  MIT: "mit",
  ISC: "isc",
  "Apache-2.0": "apache-2",
  "BSD-2-Clause": "bsd-2-clause",
  "BSD-3-Clause": "bsd-3-clause",
  "0BSD": "0bsd",
  "MPL-2.0": "mpl-2",
  "EPL-2.0": "epl-2",
  "LGPL-3.0-or-later": "lgpl-3-or-later",
  "CC-BY-4.0": "cc-by-4",
  "CC0-1.0": "cc0-1",
  "OFL-1.1": "ofl-1-1",
  Unlicense: "unlicense",
};

/** ライセンスの原文らしいファイル */
const LICENSE_FILE = /^(licen[cs]e|copying|notice)([-._].*)?$/i;

/** ライセンスの式(MIT OR Apache-2.0 など)に出てくるSPDXの識別子 */
export function spdxIds(expr) {
  return [...new Set(expr.match(/[A-Za-z0-9.+-]+/g) ?? [])].filter(
    (id) => !["OR", "AND", "WITH"].includes(id),
  );
}

/** 原文のid。同じ原文は同じidになる */
export function textId(body) {
  return `oss-${createHash("sha256").update(body).digest("hex").slice(0, 10)}`;
}

/** パッケージのフォルダにある原文。いくつかあればつなげる(MITとApache-2.0の両方など) */
export function readTexts(dir) {
  let files;
  try {
    files = readdirSync(dir)
      .filter((f) => LICENSE_FILE.test(f))
      .sort();
  } catch {
    return "";
  }
  const bodies = files.map((f) => ({
    f,
    body: readFileSync(path.join(dir, f), "utf8")
      .replace(/\r\n/g, "\n")
      .trimEnd(),
  }));
  if (bodies.length === 0) return "";
  if (bodies.length === 1) return `${bodies[0].body}\n`;
  return `${bodies.map(({ f, body }) => `==> ${f} <==\n\n${body}`).join("\n\n")}\n`;
}

/**
 * 1つのパッケージの原文を決める。パッケージに入っていればそれ、なければSPDXの原文。
 * どちらもなければnull
 */
function resolveText(dir, license, texts) {
  const own = readTexts(dir);
  if (own !== "") {
    const id = textId(own);
    texts[id] ??= own;
    return id;
  }
  const ids = spdxIds(license)
    .map((s) => SPDX[s])
    .filter(
      (id) =>
        id !== undefined && existsSync(path.join(licensesDir, `${id}.txt`)),
    );
  // SPDXの原文は content/licenses/ にあるので、idだけを指す
  return ids[0] ?? null;
}

function npmPackages(texts) {
  const out = execFileSync(
    "pnpm",
    ["--filter", "@portfolio/web...", "licenses", "list", "--prod", "--json"],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const byLicense = JSON.parse(out);
  const list = [];
  for (const [license, pkgs] of Object.entries(byLicense)) {
    for (const p of pkgs) {
      p.versions.forEach((version, i) => {
        const dir = p.paths[i] ?? p.paths[0];
        list.push({
          name: p.name,
          version,
          license,
          url: p.homepage ?? `https://www.npmjs.com/package/${p.name}`,
          text: resolveText(dir, license, texts),
        });
      });
    }
  }
  return list;
}

function cargoCrates(texts) {
  // 原文を読むので、クレートのソースを手元に落としておく(Cargo.lockのとおり)
  execFileSync("cargo", ["fetch", "--locked"], { cwd: root, stdio: "ignore" });
  const meta = JSON.parse(
    execFileSync(
      "cargo",
      [
        "metadata",
        "--format-version",
        "1",
        "--locked",
        "--filter-platform",
        "wasm32-unknown-unknown",
      ],
      { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
    ),
  );
  const pkgs = new Map(meta.packages.map((p) => [p.id, p]));
  const nodes = new Map(meta.resolve.nodes.map((n) => [n.id, n]));
  const workspace = new Set(meta.workspace_members);
  // WebAssemblyにするクレートから、ふつうの依存(dev・buildは除く)をたどる
  const seen = new Set();
  const stack = meta.packages
    .filter((p) => WASM_CRATES.includes(p.name) && workspace.has(p.id))
    .map((p) => p.id);
  while (stack.length > 0) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const d of nodes.get(id)?.deps ?? []) {
      if (d.dep_kinds.some((k) => k.kind === null)) stack.push(d.pkg);
    }
  }
  return [...seen]
    .filter((id) => !workspace.has(id))
    .map((id) => pkgs.get(id))
    .map((p) => ({
      name: p.name,
      version: p.version,
      license: p.license ?? "Unknown",
      url: p.repository ?? `https://crates.io/crates/${p.name}`,
      text: resolveText(path.dirname(p.manifest_path), p.license ?? "", texts),
    }));
}

const byName = (a, b) =>
  a.name.localeCompare(b.name) || a.version.localeCompare(b.version);

async function main() {
  const texts = {};
  const npm = npmPackages(texts).sort(byName);
  const cargo = cargoCrates(texts).sort(byName);
  const sorted = Object.fromEntries(
    Object.entries(texts).sort(([a], [b]) => a.localeCompare(b)),
  );
  mkdirSync(path.join(web, ".content"), { recursive: true });
  writeFileSync(
    path.join(web, ".content/oss.json"),
    `${JSON.stringify({ npm, cargo, texts: sorted }, null, 2)}\n`,
  );
  const missing = [...npm, ...cargo].filter((p) => p.text === null);
  console.log(
    `ライブラリ: npm ${String(npm.length)}・Rust ${String(cargo.length)}、原文 ${String(Object.keys(sorted).length)}`,
  );
  for (const p of missing)
    console.log(
      `::warning::${p.name} ${p.version} (${p.license}) の原文が見つかりません`,
    );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
