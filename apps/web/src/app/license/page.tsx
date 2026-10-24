import { Licenses } from "@/components/license/Licenses";
import { Section } from "@/components/section/Section";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("license");

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
