"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PxCat } from "@/components/px-cat/PxCat";
import * as s from "./header.css";

const PEEK = ["peek", "peekBlink"] as const;

const PAGES = [
  { href: "/about/", label: "About" },
  { href: "/skills/", label: "Skills" },
  { href: "/work/", label: "Work" },
  { href: "/affiliations/", label: "Affiliations" },
  { href: "/events/", label: "Events" },
  { href: "/shelf/", label: "Shelf" },
  { href: "/stack/", label: "Stack" },
  { href: "/cats/", label: "Cats" },
] as const;

export function Header() {
  const pathname = usePathname();

  return (
    <header className={s.top}>
      <Link className={s.logo} href="/" aria-label="小峯圭也（ホームへ）">
        <PxCat className={s.logoCat} frames={PEEK} coat="kuro" pixel={4} />
        <span className={s.logoTxt} aria-hidden="true">
          とっぷへ
        </span>
      </Link>
      <nav className={s.nav} aria-label="ページ">
        {PAGES.map(({ href, label }) => (
          <Link
            key={href}
            className={s.navLink}
            href={href}
            aria-current={pathname.startsWith(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
