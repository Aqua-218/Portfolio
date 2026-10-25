"use client";

import { useEffect, useState } from "react";
import { EventView } from "@/components/events/EventView";
import * as e from "@/components/events/events.css";
import * as s from "./admin.css";
import type { EventMeta } from "./frontmatter";

/**
 * プレビュー。本番と同じコンポーネント(EventView)と、同じMarkdownの処理で出す。
 * Markdownの処理(Shikiなど)は大きいので、プレビューを開いたときに読み込む
 */
export function Preview({
  slug,
  meta,
  body,
}: {
  slug: string;
  /** イベントなら項目。なければ本文だけ */
  meta?: EventMeta;
  body: string;
}) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    // 打つたびに走らせないよう、少し待つ
    const timer = setTimeout(() => {
      void import("@portfolio/markdown/browser")
        .then(({ renderPreview }) => renderPreview(body))
        .then((out) => {
          if (alive) setHtml(out);
        });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [body]);

  if (html === null) return <p className={s.note}>プレビューを作っています…</p>;
  return (
    <section className={s.preview} aria-label="プレビュー">
      {meta ? (
        <ol className={e.list}>
          <EventView
            event={{ slug, ...meta, end: meta.end === "" ? null : meta.end }}
            html={html}
          />
        </ol>
      ) : (
        <div className={e.body} dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </section>
  );
}
