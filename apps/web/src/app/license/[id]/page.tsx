import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as l from "@/components/license/license.css";
import { Section } from "@/components/section/Section";
import * as s from "@/components/section/section.css";
import { licenseBody, licenseTexts } from "@/lib/licenses";
import { pageMeta } from "@/lib/meta";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return licenseTexts().map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = licenseTexts().find((x) => x.id === id);
  return {
    ...pageMeta("license", t ? `${t.name} の原文` : undefined),
    // 原文はどこにでもあるものなので、検索には載せない
    robots: { index: false },
  };
}

/** ライセンスの原文。ライセンス・クレジットのページから、ライセンスの名前でリンクする */
export default async function LicenseText({ params }: Props) {
  const { id } = await params;
  const t = licenseTexts().find((x) => x.id === id);
  if (!t) notFound();
  return (
    <Section
      name="license"
      id="p-license-text"
      title="License"
      subtitle="ライセンスの原文"
      page
    >
      <h2 className={l.textTitle}>{t.name}</h2>
      <p className={l.users}>
        使っているもの({t.users.length}): {t.users.join("・")}
      </p>
      <pre className={l.text}>{licenseBody(t.id)}</pre>
      <Link className={s.more} href="/license/">
        ライセンス・クレジットへ
      </Link>
    </Section>
  );
}
