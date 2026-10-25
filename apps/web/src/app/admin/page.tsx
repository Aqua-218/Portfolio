import type { Metadata } from "next";
import { Lead, Section } from "@/components/section/Section";
import { SITE_NAME } from "@/lib/meta";

export const metadata: Metadata = {
  title: { absolute: `Admin | ${SITE_NAME}` },
  // 管理画面は検索に載せない。サイトのどこからもリンクしない
  robots: { index: false, follow: false },
};

/** 管理画面。content/をブラウザから編集して、GitHubにコミットする */
export default function Admin() {
  return (
    <Section name="admin" id="p-admin" title="Admin" subtitle="管理画面" page>
      <Lead>content/ をここから編集して、GitHub にコミットします。</Lead>
    </Section>
  );
}
