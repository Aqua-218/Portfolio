import type { Post } from "@portfolio/content-types";
import { type Dates, qiitaUrl, type TocItem } from "@/lib/blog";
import { md } from "@/styles/markdown.css";
import * as s from "./blog.css";
import { day, Tags } from "./Posts";

function TocList({ toc }: { toc: TocItem[] }) {
  return (
    <ol className={s.tocList}>
      {toc.map((t) => (
        <li
          key={t.id}
          className={
            t.level === 3 ? s.tocSub2 : t.level === 2 ? s.tocSub : undefined
          }
        >
          <a href={`#${t.id}`}>{t.text}</a>
        </li>
      ))}
    </ol>
  );
}

/**
 * 記事1つの見た目。本文はHTMLにしたものを受け取る。
 * サイト(ビルド)と、管理画面のプレビュー(#245)で同じものを使う
 */
export function PostView({
  post,
  dates,
  html,
  toc,
}: {
  post: Pick<Post, "title" | "tags" | "id">;
  dates: Dates;
  html: string;
  toc: TocItem[];
}) {
  return (
    <div className={s.article}>
      <article>
        <header className={s.head}>
          <h1 className={s.postTitle}>{post.title}</h1>
          <p className={s.meta}>
            <span>
              公開{" "}
              <time dateTime={dates.published}>{day(dates.published)}</time>
            </span>
            {dates.updated !== dates.published && (
              <span>
                更新 <time dateTime={dates.updated}>{day(dates.updated)}</time>
              </span>
            )}
            {post.id && (
              <a
                className={s.qiita}
                href={qiitaUrl(post.id)}
                target="_blank"
                rel="noopener"
              >
                Qiitaで読む
              </a>
            )}
          </p>
          <Tags tags={post.tags} />
          {/* 狭い画面では、目次を本文の前にたたんで置く */}
          {toc.length > 0 && (
            <details className={s.tocFold}>
              <summary>目次</summary>
              <TocList toc={toc} />
            </details>
          )}
        </header>
        <div className={md} dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      {toc.length > 0 && (
        <nav className={s.toc} aria-labelledby="toc-h">
          <h2 className={s.tocTitle} id="toc-h">
            目次
          </h2>
          <TocList toc={toc} />
        </nav>
      )}
    </div>
  );
}
