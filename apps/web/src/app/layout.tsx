import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/header/Header";
import "@/styles/global.css";
import { wrap } from "@/styles/layout.css";
import { geist, lineSeedJp } from "./fonts";

export const metadata: Metadata = {
  title: "小峯 圭也",
  description:
    "高校1年生のソフトウェアエンジニア、小峯圭也のポートフォリオ。写真はぜんぶ猫。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} ${lineSeedJp.variable}`}>
      <body>
        <div className={wrap}>
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
