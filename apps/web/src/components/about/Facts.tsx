import { Reveal } from "@/components/reveal/Reveal";
import { site } from "@/lib/content";
import * as s from "./about.css";

/** 基本のアレコレ。Homeでは短い添え書き(subShort)を使う。 */
export function Facts({ short = false }: { short?: boolean }) {
  return (
    <dl className={s.facts}>
      {site().profile.facts.map((f, i) => {
        const sub = short ? (f.subShort ?? f.sub) : f.sub;
        return (
          <Reveal
            key={f.label}
            className={f.wide ? `${s.fact} ${s.wide}` : s.fact}
            delay={0.1 + i * 0.06}
          >
            <dt>{f.label}</dt>
            <dd>
              {f.value}
              {sub && <span>{sub}</span>}
            </dd>
          </Reveal>
        );
      })}
    </dl>
  );
}
