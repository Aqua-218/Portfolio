import { og } from "@/lib/og";
import { PAGES } from "@/lib/meta";

export { contentType, size } from "@/lib/og";
export const dynamic = "force-static";
export const alt = PAGES.cats.title;

export default function Image() {
  return og(PAGES.cats.title, PAGES.cats.subtitle);
}
