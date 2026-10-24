import type { Company } from "@portfolio/content-types";
import { Reveal } from "@/components/reveal/Reveal";
import * as r from "@/components/rows/rows.css";
import { site } from "@/lib/content";
import * as s from "./work.css";

function CompanyLink({ company }: { company: Company }) {
  return (
    <a className={r.co} href={company.url} target="_blank" rel="noopener">
      {company.prefix && <small>{company.prefix}</small>}
      <span className={r.coName}>{company.name}</span>
    </a>
  );
}

/** "2022-11" → "2022年11月" */
function founded(ym: string): string {
  const [y, m] = ym.split("-");
  return `${y ?? ""}年${String(Number(m))}月`;
}

/** Homeの抜粋。会社名とリンクだけ。 */
export function CompanyRows() {
  return (
    <ul className={r.rows}>
      {site().work.map((c, i) => (
        <Reveal
          as="li"
          key={c.slug}
          kind="left"
          delay={0.1 + i * 0.08}
          className={r.row}
        >
          <CompanyLink company={c} />
        </Reveal>
      ))}
    </ul>
  );
}

/** Workのページ。会社ごとの説明と、設立・所在地・サイト。 */
export function Companies() {
  return (
    <div className={s.companies}>
      {site().work.map((c, i) => (
        <Reveal
          as="article"
          key={c.slug}
          id={`work-${c.slug}`}
          delay={0.1 + i * 0.1}
          className={s.company}
        >
          <CompanyLink company={c} />
          <p>{c.description}</p>
          {c.tagline && <q>{c.tagline}</q>}
          <dl className={s.meta}>
            <div>
              <dt>設立</dt>
              <dd>{founded(c.founded)}</dd>
            </div>
            <div>
              <dt>所在地</dt>
              <dd>{c.location}</dd>
            </div>
            <div>
              <dt>サイト</dt>
              <dd>
                <a href={c.url} target="_blank" rel="noopener">
                  {new URL(c.url).host}
                </a>
              </dd>
            </div>
          </dl>
        </Reveal>
      ))}
    </div>
  );
}
