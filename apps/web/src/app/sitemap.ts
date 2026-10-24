import type { MetadataRoute } from "next";
import { site } from "@/lib/content";
import { PAGES, SITE_URL } from "@/lib/meta";

export const dynamic = "force-static";

/** 全ページ。管理画面(/admin/)は載せない */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    ...Object.keys(PAGES).map((name) => `/${name}/`),
    ...site().events.map((ev) => `/events/${ev.slug}/`),
  ];
  return paths.map((p) => ({ url: new URL(p, SITE_URL).href }));
}
