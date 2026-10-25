import { Suspense } from "react";
import { BlogList } from "@/components/blog/BlogList";
import { Posts } from "@/components/blog/Posts";
import { Lead, Section } from "@/components/section/Section";
import { dates, posts, sorted, tags } from "@/lib/blog";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("blog");

export default function Blog() {
  const items = sorted(posts()).map((p) => ({
    slug: p.slug,
    title: p.title,
    tags: p.tags,
    published: dates(p.slug).published,
  }));
  return (
    <Section name="blog" id="p-blog" title="Blog" subtitle="技術ブログ" page>
      <Lead>Qiitaにも出している記事。</Lead>
      {/* タグの絞り込みはURLの?tag=を読むので、書き出すときは全部の記事を出しておく */}
      <Suspense fallback={<Posts items={items} />}>
        <BlogList items={items} tags={tags().map((t) => t.name)} />
      </Suspense>
    </Section>
  );
}
