import { Facts } from "@/components/about/Facts";
import { Timeline } from "@/components/about/Timeline";
import { Lead, Section, Sub } from "@/components/section/Section";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("about");

export default function About() {
  return (
    <Section
      name="about"
      id="p-about"
      title="About"
      subtitle="基本のアレコレ"
      page
    >
      <Lead>
        東京生まれ、栃木在住の高校1年生です。N高等学校に通いながら、ソフトウェアエンジニアとして3社の開発に関わっています。
      </Lead>
      <Facts />
      <Sub id="about-history">経歴</Sub>
      <Timeline />
    </Section>
  );
}
