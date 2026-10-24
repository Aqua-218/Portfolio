import { EventYears } from "@/components/events/Events";
import { Lead, Section } from "@/components/section/Section";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("events");

export default function Events() {
  return (
    <Section
      name="events"
      id="p-events"
      title="Events"
      subtitle="参加したイベント"
      page
    >
      <Lead>今まで参加したイベント。なんとなく、まとめてみたかった。</Lead>
      <EventYears />
    </Section>
  );
}
