"use client";

import { useEffect } from "react";

/** 画像が読めなかったリンクカードを、画像なしのカードにする */
function drop(img: HTMLImageElement) {
  img.closest(".lcard")?.classList.remove("lcard-img");
  img.remove();
}

/**
 * リンクカードの画像が読めなかったら外す。
 * ページを読み込んだ時点ですでに失敗しているものと、あとで失敗するものの両方を見る。
 */
export function CardImages() {
  useEffect(() => {
    for (const img of document.querySelectorAll<HTMLImageElement>(
      "img.lc-img",
    )) {
      if (img.complete && img.naturalWidth === 0) drop(img);
    }
    // errorは泡立たないので、捕まえる側で受ける
    const onError = (e: Event) => {
      if (e.target instanceof HTMLImageElement && e.target.matches(".lc-img"))
        drop(e.target);
    };
    document.addEventListener("error", onError, true);
    return () => {
      document.removeEventListener("error", onError, true);
    };
  }, []);
  return null;
}
