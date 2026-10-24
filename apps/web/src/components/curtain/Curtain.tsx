"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PxCat } from "@/components/px-cat/PxCat";
import * as s from "./curtain.css";

const LABEL: Readonly<Record<string, string>> = {
  "/": "Home",
  "/about": "About",
  "/skills": "Skills",
  "/work": "Work",
  "/affiliations": "Affiliations",
  "/events": "Events",
  "/shelf": "Shelf",
  "/cats": "Cats",
  "/stack": "Stack",
  "/license": "License",
};

/** 末尾の/をそろえる。usePathnameとlocation.pathnameで付き方が違うため。 */
function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

function labelOf(path: string): string {
  const p = normalize(path);
  return LABEL[p] ?? LABEL[`/${p.split("/")[1] ?? ""}`] ?? "";
}

const RUN = ["runA", "runB"] as const;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function reducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// 戻る・進むのときは、Next.jsより先にpopstateを受け取って止め、幕を閉じてから流し直す。
// Next.jsはハイドレーションのときに自分のリスナーを足すので、このファイルを読んだ時点で足しておく。
let onPopState: ((e: PopStateEvent) => void) | undefined;
let replaying = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", (e) => {
    if (!replaying) onPopState?.(e);
  });
}

/** ページを移るとき、幕が閉じてから開く。 */
export function Curtain() {
  const router = useRouter();
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const runnerRef = useRef<HTMLSpanElement>(null);
  const [label, setLabel] = useState("");
  const arrived = useRef<((path: string) => void) | undefined>(undefined);

  useEffect(() => {
    arrived.current?.(normalize(pathname));
  }, [pathname]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let busy = false;

    const until = (path: string) =>
      new Promise<void>((resolve) => {
        arrived.current = (p) => {
          if (p !== normalize(path)) return;
          arrived.current = undefined;
          resolve();
        };
      });

    async function go(to: string, navigate: () => void) {
      busy = true;
      setLabel(labelOf(to));
      el?.classList.add(s.busy);
      // 幕が閉じている間に、黒猫が2.4秒で横切る
      const runner = runnerRef.current;
      if (runner) {
        runner.style.visibility = "visible";
        void runner
          .animate([{ left: "-120px" }, { left: "calc(100% + 40px)" }], {
            duration: 2400,
            easing: "linear",
          })
          .finished.then(() => {
            runner.style.visibility = "hidden";
          });
      }
      await el?.animate([{ translate: "-101% 0" }, { translate: "0 0" }], {
        duration: 560,
        easing: "cubic-bezier(0.7, 0, 0.3, 1)",
        fill: "forwards",
      }).finished;
      const done = until(new URL(to, location.href).pathname);
      navigate();
      await done;
      await wait(1050);
      await el?.animate([{ translate: "0 0" }, { translate: "101% 0" }], {
        duration: 760,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "forwards",
      }).finished;
      el?.getAnimations().forEach((a) => {
        a.cancel();
      });
      el?.classList.remove(s.busy);
      busy = false;
    }

    const onClick = (e: MouseEvent) => {
      if (busy || reducedMotion() || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      if (
        !a ||
        (a.target && a.target !== "_self") ||
        a.hasAttribute("download")
      )
        return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (normalize(url.pathname) === normalize(location.pathname)) return;
      e.preventDefault();
      e.stopPropagation();
      const to = url.pathname + url.search + url.hash;
      void go(to, () => {
        router.push(to);
      });
    };

    onPopState = (e) => {
      if (busy || reducedMotion()) return;
      e.stopImmediatePropagation();
      void go(location.pathname, () => {
        replaying = true;
        window.dispatchEvent(
          new PopStateEvent("popstate", { state: e.state as unknown }),
        );
        replaying = false;
      });
    };

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      onPopState = undefined;
    };
  }, [router]);

  return (
    <>
      <div ref={ref} className={s.curtain} aria-hidden="true">
        <span className={s.label}>{label}</span>
      </div>
      <span ref={runnerRef} className={s.runner} aria-hidden="true">
        <PxCat frames={RUN} coat="kuro" pixel={5} motion="run" />
      </span>
    </>
  );
}
