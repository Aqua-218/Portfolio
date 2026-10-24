import type { Event } from "@portfolio/content-types";
import { render } from "@portfolio/markdown";
import Link from "next/link";
import * as a from "@/components/about/about.css";
import { Reveal } from "@/components/reveal/Reveal";
import * as r from "@/components/rows/rows.css";
import { groupHeading } from "@/components/section/section.css";
import { site } from "@/lib/content";
import * as s from "./events.css";

/** "2026-08-10" と "2026-08-15" → "8/10–15"。月をまたぐときは "8/31–9/2"。 */
export function when(event: Event): string {
  const [, m = "", d = ""] = event.date.split("-");
  const start = `${String(Number(m))}/${String(Number(d))}`;
  if (!event.end) return start;
  const [, em = "", ed = ""] = event.end.split("-");
  return em === m
    ? `${start}–${String(Number(ed))}`
    : `${start}–${String(Number(em))}/${String(Number(ed))}`;
}

/** 年度(4月に始まる年)。 */
function fiscalYear(event: Event): number {
  const [y = "0", m = "0"] = event.date.split("-");
  return Number(m) >= 4 ? Number(y) : Number(y) - 1;
}

/** イベント1件。`link`を付けると、タイトルから1件のページへ行ける。 */
export async function EventItem({
  event,
  link = false,
  delay = 0,
}: {
  event: Event;
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
        <div
          className={s.body}
          dangerouslySetInnerHTML={{ __html: await render(event.body) }}
        />
      </div>
    </Reveal>
  );
}

/** 年度ごとの一覧。年度の中は古い順。 */
export function EventYears() {
  const events = site().events;
  const years = [...new Set(events.map(fiscalYear))].sort((x, y) => x - y);
  return (
    <>
      {years.map((y) => {
        const note = site().eventYears.find((n) => n.year === y)?.note;
        return (
          <div key={y} className={s.year} id={`ev-${String(y)}`}>
            <Reveal as="h3" className={s.yearHeading}>
              {y}
              {note && <small>{note}</small>}
            </Reveal>
            <ol className={s.list}>
              {events
                .filter((e) => fiscalYear(e) === y)
                .map((e, i) => (
                  <EventItem
                    key={e.slug}
                    event={e}
                    link
                    delay={0.1 + i * 0.05}
                  />
                ))}
            </ol>
          </div>
        );
      })}
    </>
  );
}

/** Homeの「最近のイベント」。新しい順に3件。 */
export function RecentEvents() {
  const recent = [...site().events].reverse().slice(0, 3);
  return (
    <>
      <h3 className={groupHeading}>最近のイベント</h3>
      <ol className={a.timeline}>
        {recent.map((e, i) => (
          <Reveal
            as="li"
            key={e.slug}
            kind="left"
            delay={0.1 + i * 0.08}
            className={a.item}
          >
            <time dateTime={e.date}>{when(e)}</time>
            <span className={s.mini}>
              <b>{e.title}</b>
              <small>@ {e.venue}</small>
            </span>
          </Reveal>
        ))}
      </ol>
    </>
  );
}
