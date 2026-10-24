import { og } from "@/lib/og";
import { PAGES } from "@/lib/meta";

export { contentType, size } from "@/lib/og";
export const dynamic = "force-static";
export const alt = PAGES.about.title;

export default function Image() {
  return og(PAGES.about.title, PAGES.about.subtitle);
}
