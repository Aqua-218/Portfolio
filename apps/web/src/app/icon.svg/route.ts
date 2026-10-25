import { iconSvg } from "@/lib/icon";

export const dynamic = "force-static";

export function GET() {
  return new Response(iconSvg(), {
    headers: { "content-type": "image/svg+xml" },
  });
}
