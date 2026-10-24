import { og } from "@/lib/og";
import { PAGES } from "@/lib/meta";

export { contentType, size } from "@/lib/og";
export const dynamic = "force-static";
export const alt = PAGES.events.title;

export default function Image() {
  return og(PAGES.events.title, PAGES.events.subtitle);
}
