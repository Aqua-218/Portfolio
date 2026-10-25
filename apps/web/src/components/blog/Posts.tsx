import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
import * as s from "./blog.css";

/** 一覧の1行に要るもの */
export interface Item {
  slug: string;
  title: string;
  tags: string[];
  /** 公開した日(YYYY-MM-DD) */
  published: string;
}

/** "2026-10-25" → "2026.10.25" */
export function day(iso: string): string {
  return iso.replaceAll("-", ".");
}

/** 記事のタグ。押すとそのタグの記事だけの一覧へ */
export function Tags({ tags, current }: { tags: string[]; current?: string }) {
  return (
    <ul className={s.tags} aria-label="タグ">
      {tags.map((t) => (
        <li key={t}>
          <Link
            className={s.tag}
            href={`/blog/?tag=${encodeURIComponent(t)}`}
            aria-current={t === current ? "page" : undefined}
          >
            {t}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** 記事の一覧。新しい順に渡す */
export function Posts({ items, tag }: { items: Item[]; tag?: string }) {
  if (items.length === 0)
    return <p className={s.empty}>まだ記事はありません。</p>;
  return (
    <ol className={s.list}>
      {items.map((p, i) => (
        <Reveal
          as="li"
          key={p.slug}
          delay={Math.min(i, 5) * 60}
          className={s.item}
        >
          <time dateTime={p.published}>{day(p.published)}</time>
          <div>
            <p className={s.title}>
              <Link className={s.titleLink} href={`/blog/${p.slug}/`}>
                {p.title}
              </Link>
            </p>
            <Tags tags={p.tags} {...(tag ? { current: tag } : {})} />
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
