// フォントはリポジトリに入れたものを使い、ビルドで外へ取りに行かない(SIL OFL 1.1)
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import "@fontsource/geist/700.css";
import "@fontsource/geist/800.css";
import "@fontsource/line-seed-jp/400.css";
import "@fontsource/line-seed-jp/700.css";
import "@fontsource/line-seed-jp/800.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Curtain } from "@/components/curtain/Curtain";
import { CardImages } from "@/components/markdown/CardImages";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";
import { Paws } from "@/components/paw/Paws";
import { OPEN_GRAPH, SITE_NAME, SITE_URL } from "@/lib/meta";
import "@/styles/code.css";
import "@/styles/markdown.css";
import "@/styles/global.css";
import { wrap } from "@/styles/layout.css";

const DESCRIPTION =
  "高校1年生のソフトウェアエンジニア、小峯圭也のポートフォリオ。写真はぜんぶ猫。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: DESCRIPTION,
  openGraph: { ...OPEN_GRAPH, title: SITE_NAME, description: DESCRIPTION },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className={wrap}>
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
        <Curtain />
        <Paws />
        <CardImages />
      </body>
    </html>
  );
}
