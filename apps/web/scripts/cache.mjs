// content/.cache/(描いたMermaidの図と、リンクカードのOGP)を、いまのcontent/で使うものだけにする。
// ビルドでは、使った図とOGPをcontent/.cache/.usedに書き足していく(src/lib/markdown.ts)。
//   node scripts/cache.mjs start  ビルドの前に.usedを消す
//   node scripts/cache.mjs prune  ビルドのあとに、.usedにないものを消す
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("../../../content/.cache/", import.meta.url));

/**
 * .usedに書かれていない図とOGPを消し、消したものを返す。
 * .usedがないとき(ビルドが途中で止まったなど)は何も消さない
 */
export function prune(cache) {
  const usedFile = path.join(cache, ".used");
  if (!existsSync(usedFile)) return { mermaid: [], ogp: [] };
  const used = new Set(
    readFileSync(usedFile, "utf8").split("\n").filter(Boolean),
  );

  const mermaidDir = path.join(cache, "mermaid");
  const mermaid = existsSync(mermaidDir)
    ? readdirSync(mermaidDir).filter(
        (f) => f.endsWith(".svg") && !used.has(`mermaid ${f.slice(0, -4)}`),
      )
    : [];
  for (const f of mermaid) rmSync(path.join(mermaidDir, f));

  const ogpFile = path.join(cache, "ogp.json");
  let ogp = [];
  if (existsSync(ogpFile)) {
    const entries = Object.entries(JSON.parse(readFileSync(ogpFile, "utf8")));
    ogp = entries.map(([url]) => url).filter((url) => !used.has(`ogp ${url}`));
    if (ogp.length > 0) {
      const kept = entries.filter(([url]) => used.has(`ogp ${url}`));
      writeFileSync(
        ogpFile,
        `${JSON.stringify(Object.fromEntries(kept), null, 2)}\n`,
      );
    }
  }
  rmSync(usedFile);
  return { mermaid, ogp };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === "start") {
    rmSync(path.join(dir, ".used"), { force: true });
  } else if (process.argv[2] === "prune") {
    const { mermaid, ogp } = prune(dir);
    console.log(
      `使っていない図を${String(mermaid.length)}個、OGPを${String(ogp.length)}個消した`,
    );
  } else {
    console.error("使い方: node scripts/cache.mjs start|prune");
    process.exit(1);
  }
}
