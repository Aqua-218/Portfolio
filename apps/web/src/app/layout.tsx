import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Curtain } from "@/components/curtain/Curtain";
import { CardImages } from "@/components/markdown/CardImages";
import { Diagrams } from "@/components/markdown/Diagrams";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";
import { Paws } from "@/components/paw/Paws";
import { OPEN_GRAPH, SITE_NAME, SITE_URL } from "@/lib/meta";
import "@/styles/code.css";
import "@/styles/markdown.css";
import "@/styles/global.css";
import { wrap } from "@/styles/layout.css";

// フォントは、ビルドではscripts/fonts.mjsがページに書き込む。開発中はFontsourceのものを読む
if (process.env.NODE_ENV === "development") {
  void import("./dev-fonts");
}

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
        <Diagrams />
      </body>
    </html>
  );
}
