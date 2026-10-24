import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@/styles/global.css";
import { geist, lineSeedJp } from "./fonts";

export const metadata: Metadata = {
  title: "小峯 圭也",
  description:
    "高校1年生のソフトウェアエンジニア、小峯圭也のポートフォリオ。写真はぜんぶ猫。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} ${lineSeedJp.variable}`}>
      <body>{children}</body>
    </html>
  );
}
