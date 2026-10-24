"use client";

import { useEffect, useState, type RefObject } from "react";
import { observeOnce, reducedMotion } from "./observer";

/** 要素が一度でも画面に入ったか。動きを減らす設定なら、はじめから入ったことにする。 */
export function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion()) {
      const id = requestAnimationFrame(() => {
        setInView(true);
      });
      return () => {
        cancelAnimationFrame(id);
      };
    }
    return observeOnce(el, () => {
      setInView(true);
    });
  }, [ref]);

  return inView;
}
