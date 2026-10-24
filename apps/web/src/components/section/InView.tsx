"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";
import { useInView } from "@/components/reveal/useInView";

/** 一度でも画面に入ったら`inClass`を付ける`<section>`。 */
export function InViewSection({
  inClass,
  className,
  ...rest
}: ComponentPropsWithoutRef<"section"> & { inClass: string }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  return (
    <section
      ref={ref}
      className={inView ? `${className ?? ""} ${inClass}` : className}
      {...rest}
    />
  );
}
