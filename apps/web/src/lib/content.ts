import type { ImageManifest, Site } from "@portfolio/content-types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readJson(file: string): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), ".content", file), "utf8"),
  );
}

let siteCache: Site | undefined;
let imagesCache: ImageManifest["images"] | undefined;

/**
 * 検証済みの中身。ビルドの前に content-check が .content/site.json に書き出したものを読む。
 * サーバー(ビルド)でだけ使う。
 */
export function site(): Site {
  // 形は Rust の型から作った Site と同じで、content-check が検証してから書き出している
  siteCache ??= readJson("site.json") as Site;
  return siteCache;
}

/**
 * 写真ごとの srcset・幅・高さ。ビルドの前に imgpipe が .content/images.json に書き出したものを読む。
 * キーは写真の id(content/cats/<id>.jpg)。
 */
export function images(): ImageManifest["images"] {
  imagesCache ??= readJson("images.json") as ImageManifest["images"];
  return imagesCache;
}
