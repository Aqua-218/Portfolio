// Nodeでドット猫を描く。ビルド時(OGP画像など)に使う。ブラウザではindex.tsのrenderを使う。
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initSync, svg } from "../dist/pxcat_wasm.js";
import type { Coat, FrameName } from "./index";

let ready = false;

/** ドット猫のSVGの文字列を、待たずに作る。 */
export function renderSync(
  frames: readonly FrameName[],
  coat: Coat,
  pixel: number,
): string {
  if (!ready) {
    initSync({
      // new URL("…", import.meta.url)の形にすると、バンドラーがファイルを静的な資産に置き換えてしまうので、パスを組み立てる
      module: readFileSync(
        path.join(
          path.dirname(fileURLToPath(import.meta.url)),
          "../dist/pxcat_wasm_bg.wasm",
        ),
      ),
    });
    ready = true;
  }
  return svg([...frames], coat, pixel);
}
