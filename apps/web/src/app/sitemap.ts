import type { MetadataRoute } from "next";
import { posts } from "@/lib/blog";
import { site } from "@/lib/content";
import { PAGES, SITE_URL } from "@/lib/meta";

export const dynamic = "force-static";

/** 全ページ。管理画面(/admin/)と見本のページは載せない */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    ...Object.keys(PAGES).map((name) => `/${name}/`),
    ...site().events.map((ev) => `/events/${ev.slug}/`),
    // 記法の見本(/blog/sample/)と限定公開の記事は載せない
    ...posts().map((p) => `/blog/${p.slug}/`),
  ];
  return paths.map((p) => ({ url: new URL(p, SITE_URL).href }));
}
