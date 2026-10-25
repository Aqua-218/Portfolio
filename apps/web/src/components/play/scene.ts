/** 遊ぶ猫の場面を、種から決める。同じ種なら、いつも同じ顔ぶれ・同じ遊び方になる */
import type { Coat, FrameName, Motion } from "@portfolio/pxcat";
import { random } from "@/components/paw/Trail";

/** 遊び方 */
export type Act =
  /** 毛玉に飛びつく */
  | "pounce"
  /** 毛づくろい */
  | "groom"
  /** へそ天でじたばた */
  | "roll"
  /** 香箱 */
  | "loaf"
  /** 伸び */
  | "stretch"
  /** 寝る */
  | "sleep"
  /** 座ってしっぽを振る */
  | "sit"
  /** 2匹で追いかけっこ */
  | "chase";

export const ACTS: readonly Act[] = [
  "pounce",
  "groom",
  "roll",
  "loaf",
  "stretch",
  "sleep",
  "sit",
  "chase",
];

export const COATS: readonly Coat[] = [
  "kuro",
  "kiji",
  "mike",
  "chatora",
  "shiro",
];

/** 遊び方ごとのコマと動き。描き直さないよう、同じ配列を使い回す */
export const POSES: Readonly<
  Record<Act, { frames: readonly FrameName[]; motion?: Motion }>
> = {
  pounce: { frames: ["pounceA", "pounceB"], motion: "pounce" },
  groom: { frames: ["groomA", "groomB"], motion: "groom" },
  roll: { frames: ["rollA", "rollB"], motion: "roll" },
  loaf: { frames: ["loaf"] },
  stretch: { frames: ["stretch"] },
  sleep: { frames: ["sleep"] },
  sit: { frames: ["sitA", "sitB"], motion: "sit" },
  chase: { frames: ["runA", "runB"], motion: "run" },
};

/** 場面の中の1匹(追いかけっこは2匹) */
export interface Actor {
  act: Act;
  coats: Coat[];
  /** 前の猫との間(rem) */
  gap: number;
}

/** 種から`count`匹ぶんの遊び方を選ぶ。同じ遊び方・同じ毛色はなるべく重ねない */
export function scene(seed: string, count: number): Actor[] {
  const rand = random(`play:${seed}`);
  const pickFrom = <T>(list: T[]): T => {
    const i = Math.floor(rand() * list.length);
    const [x] = list.splice(i, 1);
    if (x === undefined) throw new Error("空の列からは選べません");
    return x;
  };
  const acts = [...ACTS];
  let coats = [...COATS];
  const coat = () => {
    if (coats.length === 0) coats = [...COATS];
    return pickFrom(coats);
  };
  return Array.from({ length: Math.min(count, ACTS.length) }, () => {
    const act = pickFrom(acts);
    return {
      act,
      coats: act === "chase" ? [coat(), coat()] : [coat()],
      gap: Math.round((1 + rand() * 5) * 10) / 10,
    };
  });
}
