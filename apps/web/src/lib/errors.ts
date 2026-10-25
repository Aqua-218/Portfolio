import type { LostCat } from "@/components/lost/Lost";

const SIT = ["sitA", "sitB"] as const;
const SLEEP = ["sleep"] as const;
const PEEK = ["peek", "peekBlink"] as const;
const TAIL = ["tailA", "tailB"] as const;

const cat = {
  peekKiji: { frames: PEEK, coat: "kiji", motion: "blink" },
  peekMike: { frames: PEEK, coat: "mike", motion: "blink" },
  sitKuro: { frames: SIT, coat: "kuro", motion: "sit" },
  sitMike: { frames: SIT, coat: "mike", motion: "sit" },
  sitKiji: { frames: SIT, coat: "kiji", motion: "sit" },
  sleepKuro: { frames: SLEEP, coat: "kuro" },
  sleepMike: { frames: SLEEP, coat: "mike" },
  sleepKiji: { frames: SLEEP, coat: "kiji" },
  tailKiji: { frames: TAIL, coat: "kiji", motion: "tail" },
} satisfies Record<string, LostCat>;

/**
 * 404のほかのエラーの画面。静的なサイトなので、ロリポップの.htaccessの
 * ErrorDocumentで`/errors/<番号>/`を返す(#93)
 */
export const ERRORS = {
  "400": {
    message:
      "リクエストの形がおかしいみたい。猫がキーボードの上を歩いたのかも。",
    cat: cat.peekKiji,
  },
  "401": {
    message: "ここに入るにはログインが要ります。猫は顔パスです。",
    cat: cat.sitMike,
  },
  "403": {
    message: "ここは立ち入り禁止です。猫しか入れません。",
    cat: cat.sitKuro,
  },
  "405": {
    message: "その開け方はできません。猫も、ドアは押すか引くかのどちらかです。",
    cat: cat.peekMike,
  },
  "408": {
    message: "待ちきれずに、猫が寝てしまいました。もう一度開いてみてください。",
    cat: cat.sleepKuro,
  },
  "410": {
    message: "このページはもうありません。猫がどこかへ持っていきました。",
    cat: cat.tailKiji,
  },
  "429": {
    message:
      "ちょっと急ぎすぎかも。猫も一休みしています。少し待ってから開いてください。",
    cat: cat.sleepMike,
  },
  "500": {
    message:
      "サーバーで何かがうまくいきませんでした。猫がケーブルをかじったのかも。",
    cat: cat.sitKiji,
  },
  "502": {
    message:
      "向こうのサーバーから変な返事が来ました。猫の伝言ゲームは失敗です。",
    cat: cat.peekMike,
  },
  "503": {
    message: "いまはお休み中です。猫と一緒に、少し待ってください。",
    cat: cat.sleepKiji,
  },
  "504": {
    message:
      "向こうのサーバーが返事をくれませんでした。猫も待ちくたびれています。",
    cat: cat.sleepKuro,
  },
} as const satisfies Record<string, { message: string; cat: LostCat }>;

export type ErrorCode = keyof typeof ERRORS;
