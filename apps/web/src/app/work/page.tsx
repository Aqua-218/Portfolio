import { Lead, Section } from "@/components/section/Section";
import { Companies } from "@/components/work/Work";
import { site } from "@/lib/content";

export default function Work() {
  return (
    <Section
      name="work"
      id="p-work"
      title="Work"
      subtitle="働いているところ"
      page
    >
      <Lead>いまは次の{site().work.length}社で開発に関わっています。</Lead>
      <Companies />
    </Section>
  );
}
