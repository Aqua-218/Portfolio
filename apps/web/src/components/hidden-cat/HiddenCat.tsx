"use client";

import { useRef, useState } from "react";
import { PxCat } from "@/components/px-cat/PxCat";
import * as s from "./hidden-cat.css";
import { setFound, useFound } from "./store";

const TAIL = ["tailA", "tailB"] as const;
const SIT = ["sitA", "sitB"] as const;
const MEOWS = ["にゃ", "にゃー", "みゃ"] as const;

/** おやすみの写真のうしろに隠れている黒猫。しっぽを押すと出てきて、押すと鳴く。 */
export function HiddenCat() {
  const found = useFound();
  const cat = useRef<HTMLButtonElement>(null);
  // 吹き出しは、言うたびに作り直して最初から動かす
  const [say, setSay] = useState<{ text: string; n: number } | undefined>(
    undefined,
  );

  if (!found) {
    return (
      <button
        type="button"
        className={s.tail}
        aria-label="写真のうしろに何かいる"
        onClick={() => {
          setFound();
          setSay({ text: "みつかった…！", n: 0 });
        }}
      >
        <PxCat frames={TAIL} coat="kuro" pixel={2} motion="tail" />
      </button>
    );
  }

  return (
    <button
      ref={cat}
      type="button"
      className={s.cat}
      aria-label="見つかった黒猫"
      onClick={() => {
        // 跳ねる動きを最初からやり直す
        const el = cat.current;
        if (el) {
          el.classList.remove(s.hopping);
          // レイアウトを計算し直させて、外したクラスを効かせる
          el.getBoundingClientRect();
          el.classList.add(s.hopping);
        }
        setSay((prev) => ({
          text: MEOWS[Math.floor(Math.random() * MEOWS.length)] ?? "にゃ",
          n: (prev?.n ?? 0) + 1,
        }));
      }}
    >
      <PxCat frames={SIT} coat="kuro" pixel={4} motion="sit" />
      {say && (
        <span
          key={say.n}
          className={s.bubble}
          onAnimationEnd={() => {
            setSay(undefined);
          }}
        >
          {say.text}
        </span>
      )}
    </button>
  );
}

/** フッターの一言。見つかったら変わる。 */
export function HiddenCatHint() {
  return (
    <span>
      {useFound()
        ? "みつけてくれて、ありがとにゃ。"
        : "このサイトに猫が1匹かくれています。見つかった？"}
    </span>
  );
}
