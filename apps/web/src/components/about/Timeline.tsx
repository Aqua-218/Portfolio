import { Reveal } from "@/components/reveal/Reveal";
import { site } from "@/lib/content";
import * as s from "./about.css";

/** 経歴の年表。古い順。 */
export function Timeline() {
  return (
    <ol className={s.timeline}>
      {site().profile.career.map((c, i) => (
        <Reveal
          as="li"
          key={`${String(c.year)}-${c.title}`}
          kind="left"
          delay={0.1 + i * 0.08}
          className={s.item}
        >
          <time>{c.year}</time>
          <span>
            <b>{c.title}</b>
            {c.note && <small>{c.note}</small>}
          </span>
        </Reveal>
      ))}
    </ol>
  );
}
