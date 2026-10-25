"use client";

import {
  boxSize,
  frameIndex,
  render,
  type Coat,
  type FrameName,
  type Motion,
} from "@portfolio/pxcat";
import { useEffect, useRef } from "react";
import { pxCat } from "./px-cat.css";
import { nextBlinker, reducedMotion, showFrame, subscribe } from "./ticker";

export interface PxCatProps {
  /** 重ねるコマ。最初のコマだけ見える。描き直さないよう、毎回同じ配列を渡す */
  frames: readonly FrameName[];
  coat: Coat;
  /** 1マスの大きさ(px) */
  pixel?: number;
  /** コマの切り替え方。なければ動かない */
  motion?: Motion;
  className?: string;
}

/** ドット猫。Wasmが読めるまでは、同じ大きさの場所だけ取っておく。 */
export function PxCat({
  frames,
  coat,
  pixel = 3,
  motion,
  className,
}: PxCatProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { width, height } = boxSize(frames, pixel);

  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    void render(frames, coat, pixel).then((svg) => {
      const el = ref.current;
      if (!alive || !el) return;
      el.innerHTML = svg;
      if (motion === undefined || reducedMotion()) return;
      // 瞬き・毛づくろい・へそ天・飛びつくは、猫ごとに時をずらす
      const index = ["blink", "groom", "roll", "pounce"].includes(motion)
        ? nextBlinker()
        : 0;
      unsubscribe = subscribe((n) => {
        showFrame(el, frameIndex(motion, n, index));
      });
    });
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [frames, coat, pixel, motion]);

  return (
    <span
      ref={ref}
      className={className ? `${pxCat} ${className}` : pxCat}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
