import { readFileSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Section } from "@/components/section/Section";
import { markdown } from "@/lib/markdown";
import { SITE_NAME } from "@/lib/meta";
import { md } from "@/styles/markdown.css";

export const metadata: Metadata = {
  title: { absolute: `Markdown | ${SITE_NAME}` },
  description: "記法の見本",
  // 見本なので検索には載せない
  robots: { index: false },
};

/** 本文で使える記法の見本。見た目テストの対象にして、記法の見た目が崩れないようにする */
export default async function MarkdownSample() {
  const source = readFileSync(
    path.join(process.cwd(), "../../content/samples/markdown.md"),
    "utf8",
  );
  return (
    <Section
      name="markdown"
      id="p-markdown"
      title="Markdown"
      subtitle="記法の見本"
      page
    >
      <div
        className={md}
        dangerouslySetInnerHTML={{ __html: await markdown(source) }}
      />
    </Section>
  );
}
