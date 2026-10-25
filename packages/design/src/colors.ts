// 畳の淡い緑を地に、黒猫の黒で文字、三毛の茶を差し色に。

export interface Oklch {
  readonly l: number;
  readonly c: number;
  readonly h: number;
}

export const colorNames = [
  "paper",
  "ink",
  "muted",
  "line",
  "tatami",
  "mike",
  "mikeText",
  "pxline",
  "note",
  "leaf",
  "sora",
  "kaki",
] as const;

export type ColorName = (typeof colorNames)[number];

export type Palette = Readonly<Record<ColorName, Oklch>>;

export const light: Palette = {
  paper: { l: 0.975, c: 0.009, h: 115 }, // 畳の白
  ink: { l: 0.21, c: 0.012, h: 70 }, // 黒猫
  muted: { l: 0.5, c: 0.018, h: 95 },
  line: { l: 0.885, c: 0.016, h: 112 },
  tatami: { l: 0.925, c: 0.032, h: 115 }, // 畳：タグ地
  mike: { l: 0.66, c: 0.145, h: 55 }, // 三毛の茶：差し色
  // 差し色の文字(今いるページ・日付など)。mikeのままでは地とのコントラストが3:1しかないので、少し濃くする
  mikeText: { l: 0.55, c: 0.13, h: 55 },
  pxline: { l: 0.24, c: 0.015, h: 70 }, // ドット猫の輪郭
  note: { l: 0.915, c: 0.038, h: 75 }, // 図のメモ(モックの #f2e0c8)
  leaf: { l: 0.5, c: 0.06, h: 140 }, // コードの型名
  // 管理画面のグラフの成功と失敗。色の見分けにくい人でも分かれる組(青と茶)
  sora: { l: 0.573, c: 0.125, h: 252 },
  kaki: { l: 0.66, c: 0.145, h: 55 },
};

export const dark: Palette = {
  paper: { l: 0.19, c: 0.01, h: 70 },
  ink: { l: 0.94, c: 0.01, h: 100 },
  muted: { l: 0.7, c: 0.018, h: 95 },
  line: { l: 0.31, c: 0.014, h: 80 },
  tatami: { l: 0.27, c: 0.025, h: 112 },
  mike: { l: 0.76, c: 0.13, h: 60 },
  mikeText: { l: 0.76, c: 0.13, h: 60 }, // 暗い地ではmikeのままで足りる
  pxline: { l: 0.82, c: 0.012, h: 95 },
  note: { l: 0.361, c: 0.034, h: 66 }, // モックの #4a3a2a
  leaf: { l: 0.5, c: 0.06, h: 140 },
  // 暗い地では、グラフの線や棒の明るさの範囲に入るよう、青を少し明るく、茶は明るい地と同じ
  sora: { l: 0.643, c: 0.119, h: 256 },
  kaki: { l: 0.66, c: 0.145, h: 55 },
};

export function toCss({ l, c, h }: Oklch): string {
  return `oklch(${String(l)} ${String(c)} ${String(h)})`;
}
