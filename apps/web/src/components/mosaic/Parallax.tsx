"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** 写真ごとのずれの強さ。モックと同じ。 */
const K = [-0.045, 0.035, -0.03, 0.05];

/**
 * 中の写真を、スクロールに合わせて少しずつずらす。
 * 動きを減らす設定のときと、スマホの幅(640px以下)のときはずらさない。
 */
export function Parallax({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const off = matchMedia(
      "(prefers-reduced-motion: reduce), (max-width: 640px)",
    );
    const imgs = [...root.querySelectorAll("img")];
    let ticking = false;

    const update = () => {
      ticking = false;
      if (off.matches) {
        imgs.forEach((im) => {
          im.style.removeProperty("--py");
        });
        return;
      }
      const y = Math.min(scrollY, innerHeight * 1.2);
      imgs.forEach((im, i) => {
        im.style.setProperty(
          "--py",
          `${(y * (K[i % K.length] ?? 0)).toFixed(1)}px`,
        );
      });
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    addEventListener("scroll", onScroll, { passive: true });
    off.addEventListener("change", update);
    return () => {
      removeEventListener("scroll", onScroll);
      off.removeEventListener("change", update);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
