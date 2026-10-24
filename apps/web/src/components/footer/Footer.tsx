"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiddenCatHint } from "@/components/hidden-cat/HiddenCat";
import { Trail } from "@/components/paw/Trail";
import * as s from "./footer.css";

const SITEMAP = [
  {
    href: "/",
    label: "Home",
    items: [
      { href: "/", label: "トップ" },
      { href: "/license/", label: "License" },
    ],
  },
  {
    href: "/about/",
    label: "About",
    items: [
      { href: "/about/", label: "プロフィール" },
      { href: "/about/", label: "経歴" },
    ],
  },
  {
    href: "/skills/",
    label: "Skills",
    items: [
      { href: "/skills/", label: "メインで使う" },
      { href: "/skills/", label: "言語" },
      { href: "/skills/", label: "定理証明・形式手法" },
      { href: "/skills/", label: "そのほか" },
    ],
  },
  {
    href: "/work/",
    label: "Work",
    items: [
      { href: "/work/", label: "TransWith" },
      { href: "/work/", label: "IDATENase" },
      { href: "/work/", label: "EpicAI" },
    ],
  },
  {
    href: "/affiliations/",
    label: "Affiliations",
    items: [
      { href: "/affiliations/", label: "所属団体" },
      { href: "/affiliations/", label: "コンテスト・キャンプ" },
    ],
  },
  {
    href: "/events/",
    label: "Events",
    items: [
      { href: "/events/", label: "2025" },
      { href: "/events/", label: "2026" },
    ],
  },
  {
    href: "/shelf/",
    label: "Shelf",
    items: [
      { href: "/shelf/", label: "ドラマ" },
      { href: "/shelf/", label: "アニメ" },
      { href: "/shelf/", label: "漫画・小説" },
    ],
  },
  {
    href: "/stack/",
    label: "Stack",
    items: [
      { href: "/stack/", label: "無駄遣いポイント" },
      { href: "/stack/", label: "全体の構成" },
      { href: "/stack/", label: "コーディング規約" },
    ],
  },
  {
    href: "/cats/",
    label: "Cats",
    items: [{ href: "/cats/", label: "ギャラリー" }],
  },
] as const;

function current(pathname: string, href: string): "page" | undefined {
  const here = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return here ? "page" : undefined;
}

export function Footer() {
  const pathname = usePathname();

  return (
    <>
      <Trail className={s.trail} seed="footer" angle={0} steps={8} wobble={6} />
      <nav className={s.sitemap} aria-labelledby="sm-h">
        <h2 className={s.heading} id="sm-h">
          サイトマップ
        </h2>
        {SITEMAP.map((page) => (
          <div key={page.href}>
            <Link
              className={s.smPage}
              href={page.href}
              aria-current={current(pathname, page.href)}
            >
              {page.label}
            </Link>
            <ul className={s.smList}>
              {page.items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <footer className={s.footer}>
        <span>
          © 2026 小峯圭也 / Komine Keiya ・{" "}
          <Link
            className={s.footLink}
            href="/license/"
            aria-current={current(pathname, "/license/")}
          >
            License
          </Link>
        </span>
        <HiddenCatHint />
        <span>Tochigi, JP</span>
      </footer>
    </>
  );
}
