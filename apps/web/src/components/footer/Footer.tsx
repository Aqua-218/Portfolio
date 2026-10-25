"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiddenCatHint } from "@/components/hidden-cat/HiddenCat";
import { plan, Trail } from "@/components/paw/Trail";
import { Playground } from "@/components/play/Playground";
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
  {
    href: "/blog/",
    label: "Blog",
    items: [{ href: "/blog/", label: "記事" }],
  },
] as const;

function current(pathname: string, href: string): "page" | undefined {
  const here = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return here ? "page" : undefined;
}

/**
 * 足跡の種。サイトマップにあるページ(の下)ごとに変える。
 * 知らないパスはまとめて1つにする。ないページ(404)は、書き出すときと開いたときでパスが違い、
 * 種が変わると描き直しの食い違いになるため
 */
export function footerSeed(pathname: string): string {
  const top = pathname.split("/")[1] ?? "";
  const known = top === "" || SITEMAP.some((p) => p.href === `/${top}/`);
  return `footer:${known ? top : "?"}`;
}

/** サイトマップの上の足跡。ページごとに、歩く向きと場所を変える */
function FooterTrail({ pathname }: { pathname: string }) {
  const seed = footerSeed(pathname);
  const p = plan(seed, {
    // 横に歩くのを基本に、斜めに上り下りするページもある
    angle: [-32, 32],
    steps: [5, 11],
    wobble: [4, 18],
    // 左の端・まんなか・右の端のどこにでも置く。足跡の幅は60%までなので、40%までずらせる
    x: [0, 40],
    y: [0, 1.5],
  });
  // 半分ほどのページでは左へ歩き、右の端から数えて置く
  const left = (p.steps + Math.round(p.x)) % 2 === 1;
  const offset = `${String(p.x)}%`;
  return (
    <Trail
      className={s.trail}
      seed={seed}
      angle={left ? 180 + p.angle : p.angle}
      steps={p.steps}
      wobble={p.wobble}
      style={{
        marginLeft: left ? "auto" : offset,
        marginRight: left ? offset : "auto",
        marginTop: `${String(p.y)}rem`,
      }}
    />
  );
}

export function Footer() {
  const pathname = usePathname();

  return (
    <>
      <Playground seed={footerSeed(pathname)} count={3} className={s.play} />
      <FooterTrail pathname={pathname} />
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
