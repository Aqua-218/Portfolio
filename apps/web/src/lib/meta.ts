import type { Metadata } from "next";

/** 本番のURL */
export const SITE_URL = "https://komineko.jp";

export const SITE_NAME = "小峯 圭也";

/** ページの見出しと、その下の一言。titleとdescriptionとOGP画像に使う */
export const PAGES = {
  about: { title: "About", subtitle: "基本のアレコレ" },
  skills: { title: "Skills", subtitle: "使える技術" },
  work: { title: "Work", subtitle: "働いているところ" },
  affiliations: { title: "Affiliations", subtitle: "所属" },
  events: { title: "Events", subtitle: "参加したイベント" },
  shelf: { title: "Shelf", subtitle: "見たもの・読んだもの" },
  stack: { title: "Stack", subtitle: "このサイトの技術の無駄遣い" },
  cats: { title: "Cats", subtitle: "猫たち" },
  license: { title: "License", subtitle: "ライセンス・クレジット" },
} as const;

/** OGPの共通の項目。ページでopenGraphを書くと親のものは消えるので、毎回入れる */
export const OPEN_GRAPH = {
  siteName: SITE_NAME,
  locale: "ja_JP",
  type: "website",
} as const;

export type PageName = keyof typeof PAGES;

/** 各ページのメタデータ。titleは「About | 小峯 圭也」になる */
export function pageMeta(name: PageName, title?: string): Metadata {
  const page = PAGES[name];
  const full = `${title ?? page.title} | ${SITE_NAME}`;
  return {
    title: { absolute: full },
    description: page.subtitle,
    openGraph: { ...OPEN_GRAPH, title: full, description: page.subtitle },
    twitter: {
      card: "summary_large_image",
      title: full,
      description: page.subtitle,
    },
  };
}
