import type { LicenseGroup } from "@portfolio/content-types";
import Link from "next/link";
import * as a from "@/components/affiliations/affiliations.css";
import { Reveal } from "@/components/reveal/Reveal";
import * as r from "@/components/rows/rows.css";
import { groupHeading } from "@/components/section/section.css";
import { site } from "@/lib/content";
import { type Library, oss } from "@/lib/licenses";
import * as s from "./license.css";

const GROUPS: readonly { group: LicenseGroup; id: string; label: string }[] = [
  { group: "icons", id: "lic-icons", label: "アイコン" },
  { group: "fonts", id: "lic-fonts", label: "フォント" },
  { group: "site", id: "lic-site", label: "このサイトのもの" },
  { group: "others", id: "lic-others", label: "そのほか" },
];

/** コードが使っているライブラリ。数が多いので、たたんでおく */
function Libraries({
  id,
  label,
  items,
}: {
  id: string;
  label: string;
  items: Library[];
}) {
  return (
    <div id={id}>
      <h2 className={groupHeading}>{label}</h2>
      <details className={s.libs}>
        <summary className={s.libsSummary}>
          {/* 数は依存の更新のたびに変わるので、たたんだところには出さない(見た目テストを揺らさない) */}
          一覧を見る
        </summary>
        <ul className={s.libList}>
          {items.map((p) => (
            <li key={`${p.name}@${p.version}`}>
              <a
                className={s.libName}
                href={p.url}
                target="_blank"
                rel="noopener"
              >
                {p.name}
              </a>
              <span className={s.libVersion}>{p.version}</span>
              {p.text ? (
                <Link
                  className={`${r.tag} ${s.textLink}`}
                  href={`/license/${p.text}/`}
                  aria-label={`${p.name} の ${p.license} の原文`}
                >
                  {p.license}
                </Link>
              ) : (
                <span className={r.tag}>{p.license}</span>
              )}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

/** 使っているロゴ・フォント・ライブラリなどのライセンスと出典。 */
export function Licenses() {
  const { npm, cargo } = oss();
  return (
    <div className={a.groups}>
      {GROUPS.map(({ group, id, label }) => (
        <div key={group} id={id}>
          <h2 className={groupHeading}>{label}</h2>
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
                    {l.license &&
                      (l.text ? (
                        // ライセンスの名前から、原文のページへ
                        <Link
                          className={`${r.tag} ${s.textLink}`}
                          href={`/license/${l.text}/`}
                          aria-label={`${l.license} の原文`}
                        >
                          {l.license}
                        </Link>
                      ) : (
                        <span className={r.tag}>{l.license}</span>
                      ))}
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
      <Libraries id="lic-npm" label="ライブラリ(JavaScript)" items={npm} />
      <Libraries
        id="lic-cargo"
        label="ライブラリ(Rust・WebAssembly)"
        items={cargo}
      />
    </div>
  );
}
