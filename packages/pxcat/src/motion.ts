/**
 * 猫の動き。どれもデザインのモックと同じで、110msごとに数を1つ進め、その数からコマを選ぶ。
 *
 * - blink: のぞく猫。ときどき目を閉じる。猫ごとにずらす
 * - tail: しっぽ。550msごとに振る
 * - sit: 座る猫。440msごとに動く
 * - run: 走る猫。220msごとに脚を入れ替える
 */
export type Motion = "blink" | "tail" | "sit" | "run";

/** 数を1つ進める間隔(ms)。 */
export const TICK_MS = 110;

/**
 * `n`回進めたときに見せるコマの番号。
 *
 * @param index 瞬きする猫の何匹目か。猫ごとに瞬きの時をずらす
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
  }
}
