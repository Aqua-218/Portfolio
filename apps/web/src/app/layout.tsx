import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "小峯 圭也",
  description:
    "高校1年生のソフトウェアエンジニア、小峯圭也のポートフォリオ。写真はぜんぶ猫。",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
