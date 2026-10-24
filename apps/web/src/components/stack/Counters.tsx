import { PxCat } from "@/components/px-cat/PxCat";
import { Reveal } from "@/components/reveal/Reveal";
import * as s from "./stack.css";

const PEEK = ["peek", "peekBlink"] as const;

/** このサイトの無駄遣いを数えたもの。数字を検査の結果から出すのは #68 */
const COUNTERS = [
  { coat: "kuro", num: 1, unit: "匹", label: "証明済みの猫" },
  { coat: "mike", num: 1, unit: "枚", label: "モデル検査済みの幕" },
  { coat: "kiji", num: 1, unit: "つ", label: "自作の管理画面" },
] as const;

export function Counters() {
  return (
    <ul className={s.counters}>
      {COUNTERS.map((c, i) => (
        <Reveal
          as="li"
          key={c.label}
          kind="pop"
          delay={0.05 + i * 0.04}
          className={s.counter}
        >
          <PxCat className={s.cat} frames={PEEK} coat={c.coat} motion="blink" />
          <span className={s.num}>
            {c.num}
            <small className={s.unit}>{c.unit}</small>
          </span>
          <span className={s.label}>{c.label}</span>
        </Reveal>
      ))}
    </ul>
  );
}
