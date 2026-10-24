import type { Category, Level, Skill } from "@portfolio/content-types";
import Link from "next/link";
import { Icons } from "@/components/icon/Icon";
import { PxCat } from "@/components/px-cat/PxCat";
import { Reveal } from "@/components/reveal/Reveal";
import { site } from "@/lib/content";
import * as s from "./skills.css";

const LEVELS: readonly { level: Level; pips: number; label: string }[] = [
  { level: "main", pips: 4, label: "メインで使う" },
  { level: "often", pips: 3, label: "よく使う" },
  { level: "can", pips: 2, label: "使える" },
  { level: "touched", pips: 1, label: "触った程度" },
];

const levelOf = (level: Level) =>
  LEVELS.find((l) => l.level === level) ?? LEVELS[0];

const KIND: Readonly<Record<Category, string>> = {
  lang: "言語",
  formal: "定理証明",
};

const PEEK = ["peek", "peekBlink"] as const;

/** 4つの肉球の目盛り。 */
export function Meter({ level }: { level: Level }) {
  const on = levelOf(level)?.pips ?? 0;
  return (
    <span className={s.meter} aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={i < on ? `${s.pip} ${s.on}` : s.pip} />
      ))}
    </span>
  );
}

/** メインで使うもの(level = "main")。言語→定理証明の順。 */
export function mains(): Skill[] {
  const all = site().skills.skills.filter((sk) => sk.level === "main");
  return [
    ...all.filter((sk) => sk.category === "lang"),
    ...all.filter((sk) => sk.category === "formal"),
  ];
}

/** 「メインで使う」の黒いカード。横に猫がのぞく。 */
export function Mains() {
  return (
    <ul className={s.mains}>
      {mains().map((sk, i) => (
        <Reveal
          as="li"
          key={sk.name}
          kind="pop"
          delay={0.1 + i * 0.08}
          className={s.main}
        >
          {sk.coat && (
            <PxCat
              className={s.mainCat}
              frames={PEEK}
              coat={sk.coat as "kuro" | "kiji" | "mike"}
              motion="blink"
            />
          )}
          <span className={s.mainKind}>{KIND[sk.category]}</span>
          <span className={s.mainName}>{sk.name}</span>
          <span className={s.mainLevel}>
            <Meter level={sk.level} />
            {levelOf(sk.level)?.label}
          </span>
        </Reveal>
      ))}
    </ul>
  );
}

/** レベルつきの一覧。 */
export function LevelList({
  category,
  label,
}: {
  category: Category;
  label: string;
}) {
  return (
    <ul className={s.lvList} aria-label={label}>
      {site()
        .skills.skills.filter((sk) => sk.category === category)
        .map((sk, i) => (
          <Reveal
            as="li"
            key={sk.name}
            kind="left"
            delay={0.05 + i * 0.03}
            className={s.lvItem}
          >
            <span className={s.lvName}>
              <Icons icons={sk.icons} />
              {sk.name}
            </span>
            <span className={s.lvVal}>
              <Meter level={sk.level} />
              <span>{levelOf(sk.level)?.label}</span>
            </span>
          </Reveal>
        ))}
    </ul>
  );
}

/** 目盛りの見方。 */
export function Legend() {
  return (
    <p className={s.legend}>
      {LEVELS.map((l) => (
        <span key={l.level}>
          <Meter level={l.level} />
          {l.label}
        </span>
      ))}
    </p>
  );
}

/** 「そのほか」。グループごとにチップを並べる。Homeでは最初のグループだけ。 */
export function ToolRows({ first = false }: { first?: boolean }) {
  const tools = site().skills.tools;
  const groups = [...new Set(tools.map((t) => t.group))].slice(
    0,
    first ? 1 : undefined,
  );
  return (
    <dl className={s.rows}>
      {groups.map((g, i) => (
        <Reveal key={g} kind="left" delay={0.1 + i * 0.06} className={s.row}>
          <dt>{g}</dt>
          <dd>
            <ul className={s.chips}>
              {tools
                .filter((t) => t.group === g)
                .map((t) => (
                  <li key={t.name}>
                    <Icons icons={t.icons} />
                    {t.name}
                  </li>
                ))}
            </ul>
          </dd>
        </Reveal>
      ))}
    </dl>
  );
}

export function Credit() {
  return (
    <p className={s.credit}>
      アイコンの出典とライセンスは <Link href="/license/">License</Link>{" "}
      に載せています。
    </p>
  );
}
