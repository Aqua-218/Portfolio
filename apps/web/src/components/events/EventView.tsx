import type { Event } from "@portfolio/content-types";
import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
import * as r from "@/components/rows/rows.css";
import * as s from "./events.css";

/** "2026-08-10" と "2026-08-15" → "8/10–15"。月をまたぐときは "8/31–9/2"。 */
export function when(event: Pick<Event, "date" | "end">): string {
  const [, m = "", d = ""] = event.date.split("-");
  const start = `${String(Number(m))}/${String(Number(d))}`;
  if (!event.end) return start;
  const [, em = "", ed = ""] = event.end.split("-");
  return em === m
    ? `${start}–${String(Number(ed))}`
    : `${start}–${String(Number(em))}/${String(Number(ed))}`;
}

/**
 * イベント1件の見た目。本文はHTMLにしたものを受け取る。
 * サイト(ビルドでMarkdownにする)と、管理画面のプレビュー(ブラウザでMarkdownにする)で同じものを使う。
 * `link`を付けると、タイトルから1件のページへ行ける。
 */
export function EventView({
  event,
  html,
  link = false,
  delay = 0,
}: {
  event: Omit<Event, "body">;
  html: string;
  link?: boolean;
  delay?: number;
}) {
  const tag = event.tags[0];
  return (
    <Reveal as="li" delay={delay} className={s.item}>
      <time dateTime={event.date}>{when(event)}</time>
      <div>
        <p className={s.title}>
          {link ? (
            <Link className={s.titleLink} href={`/events/${event.slug}/`}>
              {event.title}
            </Link>
          ) : (
            event.title
          )}
          {tag && <span className={`${r.tag} ${s.tag}`}>{tag}</span>}
        </p>
        <p className={s.venue}>@ {event.venue}</p>
        <div className={s.body} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </Reveal>
  );
}
