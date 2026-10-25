"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { pawSvg } from "@/components/paw/shape";
import { PxCat } from "@/components/px-cat/PxCat";
import { subscribe } from "@/components/px-cat/ticker";
import * as s from "./curtain.css";
import * as m from "./machine";

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
  "/blog": "Blog",
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

/**
 * 走る猫の足が着くたびに(猫の動きと同じ間隔で)、幕に足跡を付ける。左右の足で交互に少し上下にずらす。
 * 幕が閉じきっている間だけ付ける。足跡は幕の中に置くので、幕が開くときは幕と一緒に出ていく。
 * 止める関数を返す。
 */
function leavePrints(runner: HTMLElement, curtain: HTMLElement): () => void {
  return subscribe((n) => {
    const box = curtain.getBoundingClientRect();
    // 閉じる途中や開く途中に付けると、幕と一緒に流れてしまう
    if (Math.abs(box.left) > 1) return;
    const cat = runner.getBoundingClientRect();
    const x = cat.left + cat.width * 0.3;
    if (x < 0 || x > box.width) return;
    const print = document.createElement("span");
    print.className = s.print;
    print.innerHTML = pawSvg(16);
    print.style.left = `${String(x)}px`;
    print.style.top = `${String(cat.bottom - box.top + (n % 2 === 0 ? 4 : 14))}px`;
    print.addEventListener("animationend", () => {
      print.remove();
    });
    curtain.appendChild(print);
  });
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
    // 幕の状態。変わり方はmachine.tsで、specs/Curtain.tlaと同じ
    let state = m.initial(normalize(location.pathname));

    const until = (path: string) =>
      new Promise<void>((resolve) => {
        arrived.current = (p) => {
          if (p !== normalize(path)) return;
          arrived.current = undefined;
          resolve();
        };
      });

    async function go(to: string, navigate: () => void) {
      setLabel(labelOf(to));
      el?.classList.add(s.busy);
      state = m.close(state);
      // 幕が閉じている間に、黒猫が2.4秒で横切る
      const runner = runnerRef.current;
      let catDone = Promise.resolve();
      if (runner && el) {
        runner.style.visibility = "visible";
        const stopPrints = leavePrints(runner, el);
        catDone = runner
          .animate([{ left: "-120px" }, { left: "calc(100% + 40px)" }], {
            duration: 2400,
            easing: "linear",
          })
          .finished.then(() => {
            runner.style.visibility = "hidden";
            stopPrints();
          });
      }
      void catDone.then(() => {
        state = m.catGone(state);
      });
      await el?.animate([{ translate: "-101% 0" }, { translate: "0 0" }], {
        duration: 560,
        easing: "cubic-bezier(0.7, 0, 0.3, 1)",
        fill: "forwards",
      }).finished;
      state = m.cover(state);
      const path = new URL(to, location.href).pathname;
      const done = until(path);
      navigate();
      await done;
      state = m.navigate(state, normalize(path));
      await wait(1050);
      state = m.open(state);
      await el?.animate([{ translate: "0 0" }, { translate: "101% 0" }], {
        duration: 760,
        easing: "cubic-bezier(0.65, 0, 0.35, 1)",
        fill: "forwards",
      }).finished;
      // 黒猫が走り終わるのを待ってから、幕を止める(specs/Curtain.tlaのOpened)
      await catDone;
      el?.getAnimations().forEach((a) => {
        a.cancel();
      });
      // 薄れきる前に幕が開いたときの残り
      el?.querySelectorAll(`.${s.print}`).forEach((p) => {
        p.remove();
      });
      el?.classList.remove(s.busy);
      state = m.opened(state);
    }

    const onClick = (e: MouseEvent) => {
      if (reducedMotion() || e.defaultPrevented) return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const a = e.target instanceof Element ? e.target.closest("a") : null;
      // Mermaidの図の中のリンク(SVGのa)もあるので、hrefとtargetは属性から読む
      const href = a?.getAttribute("href") ?? a?.getAttribute("xlink:href");
      const target = a?.getAttribute("target");
      if (
        !a ||
        !href ||
        (target && target !== "_self") ||
        a.hasAttribute("download")
      )
        return;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      if (normalize(url.pathname) === normalize(location.pathname)) return;
      // 幕が動いている間は、幕を出さずにそのまま移る(モックと同じ)
      const pressed = m.press(state, normalize(url.pathname));
      state = pressed.state;
      if (!pressed.curtain) return;
      e.preventDefault();
      e.stopPropagation();
      const to = url.pathname + url.search + url.hash;
      void go(to, () => {
        router.push(to);
      });
    };

    onPopState = (e) => {
      if (reducedMotion()) return;
      const pressed = m.press(state, normalize(location.pathname));
      state = pressed.state;
      if (!pressed.curtain) return;
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
