"use client";

import type { TocItem } from "@portfolio/markdown/browser";
import { useEffect, useState } from "react";
import { PostView } from "@/components/blog/PostView";
import { EventView } from "@/components/events/EventView";
import * as e from "@/components/events/events.css";
import * as s from "./admin.css";
import type { EventMeta } from "./frontmatter";
import type { PostMeta } from "./post";

/** プレビューの日付。まだ公開していないので、今日 */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * プレビュー。本番と同じコンポーネント(EventView・PostView)と、同じMarkdownの処理で出す。
 * ブログの記事は、Qiitaと同じ記法で描く
 * Markdownの処理(Shikiなど)は大きいので、プレビューを開いたときに読み込む
 */
export function Preview({
  slug,
  meta,
  post,
  body,
}: {
  slug: string;
  /** イベントなら項目 */
  meta?: EventMeta;
  /** ブログの記事なら項目 */
  post?: PostMeta;
  body: string;
}) {
  const [html, setHtml] = useState<string | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const flavor = post ? "qiita" : "site";

  useEffect(() => {
    let alive = true;
    // 打つたびに走らせないよう、少し待つ
    const timer = setTimeout(() => {
      void import("@portfolio/markdown/browser").then(
        async ({ renderPreview, toc: tocOf }) => {
          const out = await renderPreview(body, flavor);
          if (!alive) return;
          setHtml(out);
          setToc(tocOf(out));
        },
      );
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [body, flavor]);

  if (html === null) return <p className={s.note}>プレビューを作っています…</p>;
  return (
    <section className={s.preview} aria-label="プレビュー">
      {post ? (
        <PostView
          post={{
            title: post.title,
            tags: post.tags,
            id: post.id === "" ? null : post.id,
          }}
          dates={{ published: today(), updated: today() }}
          html={html}
          toc={toc}
        />
      ) : meta ? (
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
