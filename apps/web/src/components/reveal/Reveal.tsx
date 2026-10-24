"use client";

import {
  useEffect,
  useRef,
  type ComponentPropsWithoutRef,
  type ElementType,
} from "react";
import { observeOnce, reducedMotion } from "./observer";
import * as s from "./reveal.css";

type RevealProps<T extends ElementType> = {
  /** 出し方。なければ下から、leftは左から、popは少し傾いて弾む */
  kind?: "left" | "pop";
  /** 出るまでの遅れ(秒) */
  delay?: number;
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/** スクロールで画面に入ったら、ふわっと出る。 */
export function Reveal<T extends ElementType = "div">({
  kind,
  delay = 0,
  as,
  className,
  style,
  ...rest
}: RevealProps<T>) {
  const Tag: ElementType = as ?? "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    // すでに見えているものはそのまま出しておく。画面の下のほうにあるものだけ隠して待つ
    if (el.getBoundingClientRect().top <= window.innerHeight * 0.92) return;
    el.classList.add(s.pre);
    return observeOnce(el, () => {
      el.classList.remove(s.pre);
      // 出たあとは遅れを消して、ホバーなどの動きを遅らせない
      setTimeout(
        () => {
          el.style.setProperty("--rd", "0s");
        },
        (delay + 0.8) * 1000,
      );
    });
  }, [delay]);

  const classes = [
    s.rv,
    kind === "left" ? s.left : kind === "pop" ? s.pop : undefined,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={ref}
      className={classes}
      style={{ ...(style as object), "--rd": `${delay.toFixed(2)}s` }}
      {...rest}
    />
  );
}
