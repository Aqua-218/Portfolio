import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventItem } from "@/components/events/Events";
import * as e from "@/components/events/events.css";
import { Section } from "@/components/section/Section";
import * as s from "@/components/section/section.css";
import { site } from "@/lib/content";
import { pageMeta } from "@/lib/meta";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return site().events.map((ev) => ({ slug: ev.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ev = site().events.find((x) => x.slug === slug);
  return pageMeta("events", ev?.title);
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const ev = site().events.find((x) => x.slug === slug);
  if (!ev) notFound();
  return (
    <Section
      name="events"
      id="p-event"
      title="Events"
      subtitle="参加したイベント"
      page
    >
      <ol className={e.list}>
        <EventItem event={ev} />
      </ol>
      <Link className={s.more} href="/events/">
        イベントの一覧へ
      </Link>
    </Section>
  );
}
