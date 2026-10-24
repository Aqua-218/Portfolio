import type { LicenseGroup } from "@portfolio/content-types";
import * as a from "@/components/affiliations/affiliations.css";
import { Reveal } from "@/components/reveal/Reveal";
import * as r from "@/components/rows/rows.css";
import { groupHeading } from "@/components/section/section.css";
import { site } from "@/lib/content";
import * as s from "./license.css";

const GROUPS: readonly { group: LicenseGroup; id: string; label: string }[] = [
  { group: "icons", id: "lic-icons", label: "アイコン" },
  { group: "fonts", id: "lic-fonts", label: "フォント" },
  { group: "site", id: "lic-site", label: "このサイトのもの" },
  { group: "others", id: "lic-others", label: "そのほか" },
];

/** 使っているロゴ・フォントなどのライセンスと出典。 */
export function Licenses() {
  return (
    <div className={a.groups}>
      {GROUPS.map(({ group, id, label }) => (
        <div key={group} id={id}>
          <h3 className={groupHeading}>{label}</h3>
          <ul className={a.orgList}>
            {site()
              .licenses.filter((l) => l.group === group)
              .map((l, i) => (
                <Reveal
                  as="li"
                  key={l.name}
                  kind="left"
                  delay={0.1 + i * 0.08}
                  className={a.org}
                >
                  <div className={a.orgTop}>
                    {l.url ? (
                      <a
                        className={`${a.name} ${a.link}`}
                        href={l.url}
                        target="_blank"
                        rel="noopener"
                      >
                        {l.name}
                      </a>
                    ) : (
                      <span className={a.name}>{l.name}</span>
                    )}
                    {l.license && <span className={r.tag}>{l.license}</span>}
                  </div>
                  <p>{l.note}</p>
                </Reveal>
              ))}
          </ul>
          {group === "icons" && (
            <p className={s.foot}>
              各ロゴの商標は、それぞれの権利者に帰属します。
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
