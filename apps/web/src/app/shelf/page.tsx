import { Lead, Section } from "@/components/section/Section";
import { Shelf as List } from "@/components/shelf/Shelf";

export default function Shelf() {
  return (
    <Section
      name="shelf"
      id="p-shelf"
      title="Shelf"
      subtitle="見たもの・読んだもの"
      page
    >
      <Lead>見たことあるドラマやアニメ、読んだ漫画や小説。</Lead>
      <List />
    </Section>
  );
}
