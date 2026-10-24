import { TICK_MS } from "@portfolio/pxcat";

type Listener = (n: number) => void;

const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | undefined;
let count = 0;
let blinkers = 0;

/** 動きを減らす設定なら、猫は止めておく。 */
export function reducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** 全部の猫で1つのタイマーを使う。最後の猫がいなくなったら止める。 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  timer ??= setInterval(() => {
    count += 1;
    for (const l of listeners) l(count);
  }, TICK_MS);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** 瞬きする猫に番号を振る。猫ごとに瞬きの時をずらすのに使う。 */
export function nextBlinker(): number {
  const index = blinkers;
  blinkers += 1;
  return index;
}

/** `i`番目のコマだけ見せる。 */
export function showFrame(root: HTMLElement, i: number): void {
  root.querySelectorAll<SVGGElement>(".fr").forEach((g, j) => {
    g.style.display = j === i ? "" : "none";
  });
}
