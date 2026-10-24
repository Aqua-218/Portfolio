import { Lead, Section, Sub } from "@/components/section/Section";
import {
  Credit,
  Legend,
  LevelList,
  Mains,
  mains,
  ToolRows,
} from "@/components/skills/Skills";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("skills");

export default function Skills() {
  return (
    <Section
      name="skills"
      id="p-skills"
      title="Skills"
      subtitle="使える技術"
      page
    >
      <Lead>
        低レイヤーと形式検証が中心です。メインは{" "}
        {mains()
          .map((sk) => sk.name)
          .join("・")}
        。
      </Lead>
      <Sub id="sk-main">メインで使う</Sub>
      <Mains />
      <Sub id="sk-lang">言語</Sub>
      <LevelList category="lang" label="言語" />
      <Sub id="sk-formal">定理証明・形式手法</Sub>
      <LevelList category="formal" label="定理証明・形式手法" />
      <Legend />
      <Sub id="sk-more">そのほか</Sub>
      <ToolRows />
      <Credit />
    </Section>
  );
}
