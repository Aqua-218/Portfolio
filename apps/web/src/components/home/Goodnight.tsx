"use client";

import { useRef, type ReactNode } from "react";
import { HiddenCat } from "@/components/hidden-cat/HiddenCat";
import { useInView } from "@/components/reveal/useInView";
import * as s from "./home.css";

/** Homeのいちばん下の写真。画面に入ったら、ゆっくり呼吸する。 */
export function Goodnight({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  return (
    <div className={s.gn}>
      <figure
        ref={ref}
        className={inView ? `${s.goodnight} ${s.inView}` : s.goodnight}
      >
        {children}
      </figure>
      <HiddenCat />
    </div>
  );
}
