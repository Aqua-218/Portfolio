import type { Event } from "@portfolio/content-types";
import * as a from "@/components/about/about.css";
import { Reveal } from "@/components/reveal/Reveal";
import { groupHeading } from "@/components/section/section.css";
import { site } from "@/lib/content";
import { markdown } from "@/lib/markdown";
import { EventView, when } from "./EventView";

export { when };
import * as s from "./events.css";

/** 年度(4月に始まる年)。 */
function fiscalYear(event: Event): number {
  const [y = "0", m = "0"] = event.date.split("-");
  return Number(m) >= 4 ? Number(y) : Number(y) - 1;
}

/** イベント1件。本文はビルドでMarkdownにする。 */
export async function EventItem({
  event,
  link = false,
  delay = 0,
}: {
  event: Event;
  link?: boolean;
  delay?: number;
}) {
  return (
    <EventView
      event={event}
      html={await markdown(event.body)}
      link={link}
      delay={delay}
    />
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
            <Reveal as="h2" className={s.yearHeading}>
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
