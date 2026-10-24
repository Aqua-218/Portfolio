import init, { svg } from "../dist/pxcat_wasm.js";

export { frameIndex, TICK_MS, type Motion } from "./motion";

/** コマ名。crates/pxcat-wasmのparse_frameと同じ。 */
export type FrameName =
  | "runA"
  | "runB"
  | "sleep"
  | "sitA"
  | "sitB"
  | "tailA"
  | "tailB"
  | "peek"
  | "peekBlink";

/** 毛色。crates/pxcat-wasmのparse_coatと同じ。 */
export type Coat = "kuro" | "kiji" | "mike";

/** コマの幅と高さ(マス)。crates/pxcat-core/src/frames.rsと同じ。 */
const FRAME_SIZE: Readonly<Record<FrameName, readonly [number, number]>> = {
  runA: [20, 9],
  runB: [20, 9],
  sleep: [17, 7],
  sitA: [14, 12],
  sitB: [14, 12],
  tailA: [7, 4],
  tailB: [7, 4],
  peek: [7, 6],
  peekBlink: [7, 6],
};

/** SVGの幅と高さ(ピクセル)。輪郭の分、上下左右に1マスずつ大きい。Wasmを読まなくてもわかる。 */
export function boxSize(
  frames: readonly FrameName[],
  pixel: number,
): { width: number; height: number } {
  let width = 0;
  let height = 0;
  for (const name of frames) {
    const [w, h] = FRAME_SIZE[name];
    width = Math.max(width, (w + 2) * pixel);
    height = Math.max(height, (h + 2) * pixel);
  }
  return { width, height };
}

let ready: Promise<unknown> | undefined;

/** Wasmを読む。何度呼んでも1回しか読まない。 */
export function load(): Promise<unknown> {
  ready ??= init();
  return ready;
}

/** ドット猫のSVGの文字列を作る。 */
export async function render(
  frames: readonly FrameName[],
  coat: Coat,
  pixel: number,
): Promise<string> {
  await load();
  return svg([...frames], coat, pixel);
}
