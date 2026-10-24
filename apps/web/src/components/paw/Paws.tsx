"use client";

import { useEffect } from "react";
import * as s from "./paw.css";
import { pawSvg } from "./shape";

const PAW = pawSvg(28);

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
