import type { Site } from "@portfolio/content-types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

let cache: Site | undefined;

/**
 * 検証済みの中身。ビルドの前に content-check が .content/site.json に書き出したものを読む。
 * サーバー(ビルド)でだけ使う。
 */
export function site(): Site {
  // 形は Rust の型から作った Site と同じで、content-check が検証してから書き出している
  cache ??= JSON.parse(
    readFileSync(join(process.cwd(), ".content/site.json"), "utf8"),
  ) as Site;
  return cache;
}
