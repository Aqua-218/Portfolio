import { og } from "@/lib/og";
import { SITE_NAME } from "@/lib/meta";

export { contentType, size } from "@/lib/og";
export const dynamic = "force-static";
export const alt = SITE_NAME;

export default function Image() {
  return og(SITE_NAME, "Komine Keiya");
}
