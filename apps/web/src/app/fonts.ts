import { Geist, LINE_Seed_JP } from "next/font/google";

export const geist = Geist({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-geist",
});

// 日本語はGoogle Fontsが文字の範囲ごとに分けて配っている。subsetsで選べないので、先読みはしない。
// 代わりのフォントの寸法の補正値もnext/fontが持っていないので、補正しない
export const lineSeedJp = LINE_Seed_JP({
  weight: ["400", "700", "800"],
  preload: false,
  adjustFontFallback: false,
  variable: "--font-line-seed-jp",
});
