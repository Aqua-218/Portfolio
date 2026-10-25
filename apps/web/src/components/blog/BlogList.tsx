"use client";

import { useSearchParams } from "next/navigation";
import { type Item, Posts, Tags } from "./Posts";
import * as s from "./blog.css";

/**
 * 記事の一覧。`?tag=Rust`なら、そのタグの記事だけにする。
 * 書き出したページには全部の記事を入れておき、絞り込みはブラウザでする
 */
export function BlogList({ items, tags }: { items: Item[]; tags: string[] }) {
  const tag = useSearchParams().get("tag") ?? undefined;
  const shown = tag ? items.filter((p) => p.tags.includes(tag)) : items;
  return (
    <>
      {tags.length > 0 && (
        <Tags tags={tags} {...(tag ? { current: tag } : {})} />
      )}
      {tag && <p className={s.filter}>「{tag}」の記事</p>}
      <Posts items={shown} {...(tag ? { tag } : {})} />
    </>
  );
}
