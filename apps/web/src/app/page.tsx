import { Facts } from "@/components/about/Facts";
import { Affiliations } from "@/components/affiliations/Affiliations";
import { RecentEvents } from "@/components/events/Events";
import { Clock } from "@/components/home/Clock";
import { Goodnight } from "@/components/home/Goodnight";
import * as h from "@/components/home/home.css";
import { Mosaic } from "@/components/mosaic/Mosaic";
import { Playground } from "@/components/play/Playground";
import { Photo } from "@/components/photo/Photo";
import { Lead, Section } from "@/components/section/Section";
import { groupHeading } from "@/components/section/section.css";
import { ShelfPicks } from "@/components/shelf/Shelf";
import { Mains, ToolRows } from "@/components/skills/Skills";
import { Counters } from "@/components/stack/Counters";
import { CompanyRows } from "@/components/work/Work";
import { site } from "@/lib/content";

export default function Home() {
  const { profile, work, cats } = site();
  return (
    <>
      <section aria-labelledby="h-name">
        <Mosaic />
        <div className={h.introRow}>
          <div>
            <h1 className={h.name} id="h-name">
              {profile.name}
              <small>{profile.romaji}</small>
            </h1>
            <p className={h.intro}>
              高校1年生のソフトウェアエンジニアです。ほぼ業務委託で、
              {work.length}
              社の開発に関わっています。このサイトの写真はぜんぶ猫です。
            </p>
          </div>
          <Clock location={profile.location} timezone={profile.timezone} />
        </div>
        <Playground seed="home" count={5} pixel={4} className={h.play} />
      </section>

      <Section
        name="about"
        id="h-about"
        title="About"
        subtitle="基本のアレコレ"
        more="/about/"
      >
        <Facts short />
      </Section>
      <Section
        name="skills"
        id="h-skills"
        title="Skills"
        subtitle="使える技術"
        more="/skills/"
      >
        <h3 className={groupHeading}>メインで使う</h3>
        <Mains />
        <ToolRows first />
      </Section>
      <Section
        name="work"
        id="h-work"
        title="Work"
        subtitle="働いているところ"
        more="/work/"
      >
        <CompanyRows />
      </Section>
      <Section
        name="affiliations"
        id="h-aff"
        title="Affiliations"
        subtitle="所属"
        more="/affiliations/"
      >
        <Affiliations />
      </Section>
      <Section
        name="events"
        id="h-events"
        title="Events"
        subtitle="参加したイベント"
        more="/events/"
      >
        <RecentEvents />
      </Section>
      <Section
        name="shelf"
        id="h-shelf"
        title="Shelf"
        subtitle="見たもの・読んだもの"
        more="/shelf/"
      >
        <ShelfPicks />
      </Section>
      <Section
        name="stack"
        id="h-stack"
        title="Stack"
        subtitle="このサイトの技術の無駄遣い"
        more="/stack/"
      >
        <Lead>見た目は静的サイト。でもドット猫は証明済みです。</Lead>
        <Counters />
      </Section>

      <Goodnight>
        <Photo id={cats.goodnight} sizes="(max-width: 1280px) 100vw, 1240px" />
      </Goodnight>
    </>
  );
}
