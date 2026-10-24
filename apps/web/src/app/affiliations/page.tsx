import { Affiliations as List } from "@/components/affiliations/Affiliations";
import { Section } from "@/components/section/Section";

export default function Affiliations() {
  return (
    <Section
      name="affiliations"
      id="p-aff"
      title="Affiliations"
      subtitle="所属"
      page
    >
      <List detail />
    </Section>
  );
}
