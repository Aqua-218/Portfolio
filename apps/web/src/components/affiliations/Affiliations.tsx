import type { Affiliation, AffiliationGroup } from "@portfolio/content-types";
import { Reveal } from "@/components/reveal/Reveal";
import * as r from "@/components/rows/rows.css";
import { groupHeading } from "@/components/section/section.css";
import { site } from "@/lib/content";
import * as s from "./affiliations.css";

const GROUPS: readonly {
  group: AffiliationGroup;
  id: string;
  label: string;
}[] = [
  { group: "org", id: "aff-orgs", label: "所属団体" },
  { group: "contest", id: "aff-contests", label: "コンテスト・キャンプ" },
];

function Name({ a }: { a: Affiliation }) {
  return a.url ? (
    <a
      className={`${s.name} ${s.link}`}
      href={a.url}
      target="_blank"
      rel="noopener"
    >
      {a.name}
    </a>
  ) : (
    <span className={s.name}>{a.name}</span>
  );
}

/** 所属団体とコンテスト・キャンプ。Homeでは名前とラベルだけ、ページでは説明も出す。 */
export function Affiliations({ detail = false }: { detail?: boolean }) {
  const all = site().affiliations;
  return (
    <div className={s.groups}>
      {GROUPS.map(({ group, id, label }) => {
        const items = all.filter((a) => a.group === group);
        return (
          <div key={group} id={detail ? id : undefined}>
            <h3 className={groupHeading}>{label}</h3>
            {detail ? (
              <ul className={s.orgList}>
                {items.map((a, i) => (
                  <Reveal
                    as="li"
                    key={a.name}
                    kind="left"
                    delay={0.1 + i * 0.08}
                    className={s.org}
                  >
                    <div className={s.orgTop}>
                      <Name a={a} />
                      <span className={r.tag}>{a.tag}</span>
                    </div>
                    <p>{a.description}</p>
                  </Reveal>
                ))}
              </ul>
            ) : (
              <ul className={r.rows}>
                {items.map((a, i) => (
                  <Reveal
                    as="li"
                    key={a.name}
                    kind="left"
                    delay={0.1 + i * 0.08}
                    className={`${r.row} ${s.homeRow}`}
                  >
                    <Name a={a} />
                    <span className={r.tag}>{a.tag}</span>
                  </Reveal>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
