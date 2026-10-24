import { og } from "@/lib/og";
import { PAGES } from "@/lib/meta";

export { contentType, size } from "@/lib/og";
export const dynamic = "force-static";
export const alt = PAGES.license.title;

export default function Image() {
  return og(PAGES.license.title, PAGES.license.subtitle);
}
