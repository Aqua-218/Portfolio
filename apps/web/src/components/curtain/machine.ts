/**
 * 幕の状態と、その変わり方。specs/Curtain.tla と同じ形にしてあり、
 * TLCが出した実行例(specs/traces/)をmachine.test.tsで再生して、仕様と一致するか確かめる。
 */

export type Phase = "idle" | "closing" | "covered" | "opening";

export interface CurtainState<P> {
  /** 幕の位置。idle: 画面の外、closing: 閉じている途中、covered: 閉じきった、opening: 開いている途中 */
  phase: Phase;
  /** 幕が動いているか */
  busy: boolean;
  /** 黒猫が走っているか */
  running: boolean;
  /** 開いている途中の幕の数 */
  opening: number;
  /** いまのページ */
  page: P;
  /** ページを移った回数 */
  moves: number;
}

export function initial<P>(page: P): CurtainState<P> {
  return {
    phase: "idle",
    busy: false,
    running: false,
    opening: 0,
    page,
    moves: 0,
  };
}

/**
 * リンクを押した。幕が動いている間は、幕を出さずにそのまま移る。
 * 幕を出すならcurtainがtrue。
 */
export function press<P>(
  s: CurtainState<P>,
  to: P,
): { state: CurtainState<P>; curtain: boolean } {
  if (s.busy) {
    return { state: { ...s, page: to, moves: s.moves + 1 }, curtain: false };
  }
  return { state: { ...s, busy: true }, curtain: true };
}

/** 幕を閉じはじめ、黒猫を走らせる */
export function close<P>(s: CurtainState<P>): CurtainState<P> {
  return { ...s, phase: "closing", running: true };
}

/** 幕が閉じきった */
export function cover<P>(s: CurtainState<P>): CurtainState<P> {
  return { ...s, phase: "covered" };
}

/** 幕の裏でページを移った */
export function navigate<P>(s: CurtainState<P>, to: P): CurtainState<P> {
  return { ...s, page: to, moves: s.moves + 1 };
}

/** 黒猫が走り終わった */
export function catGone<P>(s: CurtainState<P>): CurtainState<P> {
  return { ...s, running: false };
}

/** 幕を開きはじめる */
export function open<P>(s: CurtainState<P>): CurtainState<P> {
  return { ...s, phase: "opening", opening: s.opening + 1 };
}

/** 幕が開ききった。黒猫が走り終わってから呼ぶ */
export function opened<P>(s: CurtainState<P>): CurtainState<P> {
  if (s.running) throw new Error("黒猫が走っている間は、幕を止めない");
  return { ...s, phase: "idle", opening: s.opening - 1, busy: false };
}
