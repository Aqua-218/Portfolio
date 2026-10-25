"use client";

import { useEffect } from "react";

/** Xの埋め込みのiframeが、中身の高さを知らせてくるメッセージ */
interface TweetResize {
  "twttr.embed"?: {
    method?: string;
    params?: { height?: number }[];
  };
}

/**
 * Xの投稿の埋め込み(iframe)の高さを、中身に合わせる。
 * Xのwidgets.jsはこのサイトでは動かさないので、iframeから届くメッセージを自分で受ける。
 * 受けるのはplatform.twitter.comからのものだけで、ページにあるそのiframeの高さだけを変える
 */
export function Embeds() {
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://platform.twitter.com") return;
      let data: TweetResize;
      try {
        data = (
          typeof e.data === "string" ? JSON.parse(e.data) : e.data
        ) as TweetResize;
      } catch {
        return;
      }
      const call = data["twttr.embed"];
      const height = call?.params?.[0]?.height;
      if (call?.method !== "twttr.private.resize" || typeof height !== "number")
        return;
      for (const frame of document.querySelectorAll<HTMLIFrameElement>(
        ".embed-tweet iframe",
      )) {
        if (frame.contentWindow !== e.source) continue;
        const box = frame.parentElement;
        if (box)
          box.style.height = `${String(Math.min(Math.ceil(height), 2000))}px`;
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);
  return null;
}
