import { Licenses } from "@/components/license/Licenses";
import { Section } from "@/components/section/Section";

export default function License() {
  return (
    <Section
      name="license"
      id="p-license"
      title="License"
      subtitle="ライセンス・クレジット"
      page
    >
      <Licenses />
    </Section>
  );
}
