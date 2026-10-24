"use client";

import { useEffect } from "react";
import * as s from "./paw.css";

const PAW =
  '<svg viewBox="0 0 32 32" width="28" height="28" fill="currentColor" aria-hidden="true"><ellipse cx="16" cy="21.5" rx="7.2" ry="6"/><ellipse cx="6.5" cy="13" rx="2.9" ry="3.6" transform="rotate(-18 6.5 13)"/><ellipse cx="12.3" cy="7.6" rx="2.9" ry="3.7" transform="rotate(-6 12.3 7.6)"/><ellipse cx="19.7" cy="7.6" rx="2.9" ry="3.7" transform="rotate(6 19.7 7.6)"/><ellipse cx="25.5" cy="13" rx="2.9" ry="3.6" transform="rotate(18 25.5 13)"/></svg>';

/**
 * クリックしたところに肉球を出す。pointerdownで出すので、キーボードの操作では出ない。
 * 動きを減らす設定のときは何もしない。
 */
export function Paws() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const p = document.createElement("div");
      p.className = s.paw;
      p.innerHTML = PAW;
      p.style.left = `${String(e.pageX)}px`;
      p.style.top = `${String(e.pageY)}px`;
      p.style.rotate = `${(Math.random() * 50 - 25).toFixed(0)}deg`;
      document.body.appendChild(p);
      p.addEventListener("animationend", () => {
        p.remove();
      });
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return null;
}
