"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import * as s from "./diagrams.css";

/** 拡大・縮小の1回の倍率と、上限・下限 */
const STEP = 1.25;
const MIN = 0.5;
const MAX = 4;

/** 流れ図のノードの名前。idは`<図のid>-flowchart-<名前>-<番号>` */
function nodeName(node: Element): string | undefined {
  return /-flowchart-(.+)-\d+$/.exec(node.id)?.[1];
}

/** ノードに乗ったら、つながる線とノードを光らせる */
function highlight(figure: HTMLElement) {
  const nodes = [...figure.querySelectorAll("g.node")];
  const edges = [...figure.querySelectorAll('[data-et="edge"]')];
  const names = new Set(nodes.map(nodeName).filter(Boolean));
  // 線のdata-idは`L_<始点>_<終点>_<番号>`。名前に「_」が入ってもいいよう、知っている名前で区切る
  const ends = (edge: Element): [string, string] | undefined => {
    const id = edge
      .getAttribute("data-id")
      ?.replace(/^L_/, "")
      .replace(/_\d+$/, "");
    if (!id) return undefined;
    for (const from of names) {
      if (from && id.startsWith(`${from}_`)) {
        const to = id.slice(from.length + 1);
        if (names.has(to)) return [from, to];
      }
    }
    return undefined;
  };
  const clear = () => {
    figure.classList.remove(s.lit);
    for (const el of figure.querySelectorAll(`.${s.on}`))
      el.classList.remove(s.on);
  };
  for (const node of nodes) {
    node.addEventListener("pointerenter", () => {
      const name = nodeName(node);
      figure.classList.add(s.lit);
      node.classList.add(s.on);
      for (const edge of edges) {
        const pair = ends(edge);
        if (!pair?.includes(name ?? "")) continue;
        edge.classList.add(s.on);
        const other = pair[0] === name ? pair[1] : pair[0];
        for (const n of nodes) if (nodeName(n) === other) n.classList.add(s.on);
      }
    });
    node.addEventListener("pointerleave", clear);
  }
}

/** ボタンとドラッグで、拡大・縮小と移動をする。viewBoxを動かす */
function zoom(figure: HTMLElement, svg: SVGSVGElement) {
  const base = svg.viewBox.baseVal;
  const home = { x: base.x, y: base.y, w: base.width, h: base.height };
  let scale = 1;
  const set = (x: number, y: number, k: number) => {
    scale = Math.min(MAX, Math.max(MIN, k));
    const w = home.w / scale;
    const h = home.h / scale;
    svg.setAttribute(
      "viewBox",
      `${String(x)} ${String(y)} ${String(w)} ${String(h)}`,
    );
  };
  /** 図の中の点(cx, cy)を動かさずに、倍率をkにする */
  const zoomAt = (k: number, cx: number, cy: number) => {
    const v = svg.viewBox.baseVal;
    const next = Math.min(MAX, Math.max(MIN, k));
    const r = scale / next;
    set(cx - (cx - v.x) * r, cy - (cy - v.y) * r, next);
  };
  const center = () => {
    const v = svg.viewBox.baseVal;
    return [v.x + v.width / 2, v.y + v.height / 2] as const;
  };

  const bar = document.createElement("div");
  bar.className = s.bar;
  const button = (label: string, text: string, act: () => void) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = s.button;
    b.textContent = text;
    b.setAttribute("aria-label", label);
    b.addEventListener("click", act);
    bar.append(b);
  };
  button("拡大", "+", () => {
    zoomAt(scale * STEP, ...center());
  });
  button("縮小", "−", () => {
    zoomAt(scale / STEP, ...center());
  });
  button("元の大きさ", "↺", () => {
    set(home.x, home.y, 1);
  });
  figure.classList.add(s.zoomable);
  figure.append(bar);

  // Ctrlか⌘を押しながらのホイール(とトラックパッドのピンチ)で拡大する。ふつうのホイールはページを動かす
  svg.addEventListener(
    "wheel",
    (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const p = point(svg, e.clientX, e.clientY);
      zoomAt(e.deltaY < 0 ? scale * STEP : scale / STEP, p.x, p.y);
    },
    { passive: false },
  );

  // ドラッグで動かす。リンクを押したときは動かさない
  let drag: { x: number; y: number; vx: number; vy: number } | undefined;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || (e.target as Element).closest("a")) return;
    const v = svg.viewBox.baseVal;
    drag = { x: e.clientX, y: e.clientY, vx: v.x, vy: v.y };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const v = svg.viewBox.baseVal;
    const k = v.width / svg.getBoundingClientRect().width;
    set(
      drag.vx - (e.clientX - drag.x) * k,
      drag.vy - (e.clientY - drag.y) * k,
      scale,
    );
  });
  const end = () => {
    drag = undefined;
  };
  svg.addEventListener("pointerup", end);
  svg.addEventListener("pointercancel", end);
}

/** 画面の点を、図の中の点にする */
function point(svg: SVGSVGElement, x: number, y: number): DOMPoint {
  const m = svg.getScreenCTM();
  const p = new DOMPoint(x, y);
  return m ? p.matrixTransform(m.inverse()) : p;
}

/** Markdownの中のMermaidの図(figure.mmd)を、触れるようにする */
export function Diagrams() {
  // ページを移ったら、新しいページの図も見る
  const pathname = usePathname();
  useEffect(() => {
    for (const figure of document.querySelectorAll<HTMLElement>("figure.mmd")) {
      const svg = figure.querySelector("svg");
      if (!svg || figure.dataset.ready) continue;
      figure.dataset.ready = "true";
      highlight(figure);
      zoom(figure, svg);
    }
  }, [pathname]);
  return null;
}
