import { og } from "@/lib/og";
import { PAGES } from "@/lib/meta";

export { contentType, size } from "@/lib/og";
export const dynamic = "force-static";
export const alt = PAGES.work.title;

export default function Image() {
  return og(PAGES.work.title, PAGES.work.subtitle);
}
