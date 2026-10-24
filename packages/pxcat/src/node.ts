// Nodeでドット猫を描く。ビルド時(OGP画像など)に使う。ブラウザではindex.tsのrenderを使う。
import { readFileSync } from "node:fs";
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
      module: readFileSync(
        new URL("../dist/pxcat_wasm_bg.wasm", import.meta.url),
      ),
    });
    ready = true;
  }
  return svg([...frames], coat, pixel);
}
