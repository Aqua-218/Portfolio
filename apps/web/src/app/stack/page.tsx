import { Lead, Section, Sub } from "@/components/section/Section";
import { Counters } from "@/components/stack/Counters";
import { Diagram } from "@/components/stack/Diagram";
import { More, Samples, Tiles, Waste } from "@/components/stack/Stack";

export default function Stack() {
  return (
    <Section
      name="stack"
      id="p-stack"
      title="Stack"
      subtitle="このサイトの技術の無駄遣い"
      page
    >
      <Lead>
        見た目は猫が並ぶだけの静的サイト。裏ではだいぶ無駄なことをしています。
      </Lead>
      <Counters />
      <Sub id="stack-waste">無駄遣いポイント</Sub>
      <Waste />
      <Sub id="stack-arch">全体の構成</Sub>
      <Diagram name="arch" />
      <Sub id="stack-list">使っているもの</Sub>
      <Tiles />
      <Sub id="stack-md">Markdown で書けるもの</Sub>
      <Samples />
      <Sub id="stack-admin">管理画面から公開まで</Sub>
      <Diagram name="admin" />
      <Sub id="stack-deploy">デプロイ</Sub>
      <Diagram name="deploy" />
      <Sub id="stack-more">もっと細かい話</Sub>
      <More />
    </Section>
  );
}
