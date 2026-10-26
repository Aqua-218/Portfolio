import type { Post } from "@portfolio/content-types";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PostView } from "@/components/blog/PostView";
import { Section } from "@/components/section/Section";
import * as s from "@/components/section/section.css";
import { body, dates, posts, SAMPLE } from "@/lib/blog";
import { pageMeta } from "@/lib/meta";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

/** 記事と、記法の見本(/blog/sample/。一覧と検索には出さない) */
export function generateStaticParams() {
  return [...posts().map((p) => ({ slug: p.slug })), { slug: SAMPLE }];
}

/** 記法の見本。content/samples/qiita.md */
function sample(): Post {
  return {
    slug: SAMPLE,
    title: "記法の見本",
    tags: ["Qiita", "Markdown"],
    private: false,
    updatedAt: null,
    id: null,
    organizationUrlName: null,
    slide: false,
    ignorePublish: true,
    body: readFileSync(
      path.join(process.cwd(), "../../content/samples/qiita.md"),
      "utf8",
    ),
  };
}

function find(slug: string): Post | undefined {
  return slug === SAMPLE ? sample() : posts().find((p) => p.slug === slug);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    ...pageMeta("blog", find(slug)?.title),
    // 見本なので検索には載せない
    ...(slug === SAMPLE ? { robots: { index: false } } : {}),
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = find(slug);
  if (!post) notFound();
  const { html, toc } = await body(post);
  // 見本は日付を決めておく(見た目テストのため)
  const when =
    slug === SAMPLE
      ? { published: "2026-10-25", updated: "2026-10-25" }
      : dates(post.slug);
  return (
    <Section
      name="blog"
      id="p-post"
      title="Blog"
      subtitle="技術ブログ"
      page
      h1={false}
    >
      <PostView post={post} dates={when} html={html} toc={toc} />
      <Link className={s.more} href="/blog/">
        記事の一覧へ
      </Link>
    </Section>
  );
}
