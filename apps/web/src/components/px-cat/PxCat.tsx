"use client";

import { boxSize, render, type Coat, type FrameName } from "@portfolio/pxcat";
import { useEffect, useRef } from "react";
import { pxCat } from "./px-cat.css";

export interface PxCatProps {
  /** 重ねるコマ。最初のコマだけ見える。描き直さないよう、毎回同じ配列を渡す */
  frames: readonly FrameName[];
  coat: Coat;
  /** 1マスの大きさ(px) */
  pixel?: number;
  className?: string;
}

/** ドット猫。Wasmが読めるまでは、同じ大きさの場所だけ取っておく。 */
export function PxCat({ frames, coat, pixel = 3, className }: PxCatProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { width, height } = boxSize(frames, pixel);

  useEffect(() => {
    let alive = true;
    void render(frames, coat, pixel).then((svg) => {
      if (alive && ref.current) ref.current.innerHTML = svg;
    });
    return () => {
      alive = false;
    };
  }, [frames, coat, pixel]);

  return (
    <span
      ref={ref}
      className={className ? `${pxCat} ${className}` : pxCat}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
