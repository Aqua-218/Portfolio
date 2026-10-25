import Link from "next/link";
import type { ReactNode } from "react";
import { Trail } from "@/components/paw/Trail";
import { Photo } from "@/components/photo/Photo";
import { Reveal } from "@/components/reveal/Reveal";
import { site } from "@/lib/content";
import { InViewSection } from "./InView";
import * as s from "./section.css";

/** 見出しの横に写真を置くページ。content/cats.toml の sections のキー */
export type SectionName =
  | "about"
  | "skills"
  | "work"
  | "affiliations"
  | "events"
  | "shelf"
  | "stack"
  | "license"
  | "admin"
  | "markdown";

export interface SectionProps {
  name: SectionName;
  /** 見出しのid。Homeでは`h-<name>`、各ページでは`p-<name>` */
  id: string;
  title: string;
  subtitle: string;
  /** Homeの抜粋のとき、「くわしく見る」の行き先 */
  more?: string;
  /** 各ページのいちばん上のセクション */
  page?: boolean;
  children: ReactNode;
}

/** 左に見出しと猫の写真、右に中身を置くセクション。 */
export function Section({
  name,
  id,
  title,
  subtitle,
  more,
  page,
  children,
}: SectionProps) {
  const photo = site().cats.sections[name];
  return (
    <InViewSection
      className={
        page ? `${s.sec} ${s.page}` : more ? `${s.sec} ${s.home}` : s.sec
      }
      inClass={s.inView}
      aria-labelledby={id}
    >
      <div className={s.title}>
        <Reveal>
          <h2 className={s.heading} id={id}>
            {title}
          </h2>
          <p className={s.subtitle}>{subtitle}</p>
          {more && (
            <Link className={s.more} href={more}>
              くわしく見る
            </Link>
          )}
        </Reveal>
        {photo && (
          <Reveal as="figure" kind="pop" delay={0.15} className={s.cat}>
            <Photo id={photo} sizes="(max-width: 860px) 7.5rem, 17rem" />
          </Reveal>
        )}
        {page && <Trail className={s.trail} seed={name} angle={75} steps={7} />}
      </div>
      <div className={s.body}>{children}</div>
    </InViewSection>
  );
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className={s.lead}>{children}</p>;
}

export function Sub({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h3 className={s.sub} id={id}>
      {children}
    </h3>
  );
}
