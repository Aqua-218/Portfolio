/**
 * 猫の動き。110msごとに数を1つ進め、その数からコマを選ぶ。
 *
 * - blink: のぞく猫。ときどき目を閉じる。猫ごとにずらす
 * - tail: しっぽ。550msごとに振る
 * - sit: 座る猫。440msごとに動く
 * - run: 走る猫。220msごとに脚を入れ替える
 *
 * 遊ぶ猫のために足したもの(モックにはない)
 * - groom: 毛づくろい。330msごとに前足をなめる
 * - roll: へそ天。440msごとに足をじたばたさせる
 * - pounce: 飛びつく。長く構えて、少しだけ飛ぶ
 */
export type Motion =
  "blink" | "tail" | "sit" | "run" | "groom" | "roll" | "pounce";

/** 飛びつく猫の、1回の構えと飛びつきの長さ(回) */
const POUNCE = 26;
/** そのうち、飛びついている長さ */
const LEAP = 5;

/** 数を1つ進める間隔(ms)。 */
export const TICK_MS = 110;

/**
 * `n`回進めたときに見せるコマの番号。
 *
 * @param index 何匹目か。猫ごとに瞬きや動きの時をずらす
 */
export function frameIndex(motion: Motion, n: number, index = 0): number {
  switch (motion) {
    case "blink":
      return (n + index * 11) % 37 === 0 ? 1 : 0;
    case "tail":
      return Math.floor(n / 5) % 2;
    case "sit":
      return Math.floor(n / 4) % 2;
    case "run":
      return Math.floor(n / 2) % 2;
    case "groom":
      return Math.floor((n + index * 2) / 3) % 2;
    case "roll":
      return Math.floor((n + index * 3) / 4) % 2;
    case "pounce":
      // 長く構えて(お尻を振るように見える)、少しだけ飛びつく。猫ごとに時をずらす
      return (n + index * 9) % POUNCE >= POUNCE - LEAP ? 1 : 0;
  }
}
