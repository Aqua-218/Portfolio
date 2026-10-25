import { body, dates, posts, sorted } from "@/lib/blog";
import { SITE_NAME, SITE_URL } from "@/lib/meta";

export const dynamic = "force-static";

/** XMLの文字にする */
function esc(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** 日付(YYYY-MM-DD)を、Atomの日時にする(日本時間の0時) */
const at = (day: string) => `${day}T00:00:00+09:00`;

/** ブログのフィード(Atom)。新しい順に、本文ごと入れる */
export async function GET() {
  const list = sorted(posts());
  const self = new URL("/blog/feed.xml", SITE_URL).href;
  const home = new URL("/blog/", SITE_URL).href;
  const entries = await Promise.all(
    list.map(async (p) => {
      const url = new URL(`/blog/${p.slug}/`, SITE_URL).href;
      const d = dates(p.slug);
      const { html } = await body(p);
      return [
        "  <entry>",
        `    <title>${esc(p.title)}</title>`,
        `    <link href="${esc(url)}"/>`,
        `    <id>${esc(url)}</id>`,
        `    <published>${at(d.published)}</published>`,
        `    <updated>${at(d.updated)}</updated>`,
        ...p.tags.map((t) => `    <category term="${esc(t)}"/>`),
        `    <content type="html">${esc(html)}</content>`,
        "  </entry>",
      ].join("\n");
    }),
  );
  const updated = list
    .map((p) => dates(p.slug).updated)
    .sort()
    .at(-1);
  const xml = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja">',
    `  <title>${esc(`Blog | ${SITE_NAME}`)}</title>`,
    `  <link href="${esc(home)}"/>`,
    `  <link rel="self" href="${esc(self)}"/>`,
    `  <id>${esc(home)}</id>`,
    `  <updated>${at(updated ?? "2026-10-25")}</updated>`,
    `  <author><name>${esc(SITE_NAME)}</name></author>`,
    ...entries,
    "</feed>",
    "",
  ].join("\n");
  return new Response(xml, {
    headers: { "content-type": "application/atom+xml; charset=utf-8" },
  });
}
