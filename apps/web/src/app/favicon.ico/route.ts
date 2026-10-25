import { ico, iconPng } from "@/lib/icon";

export const dynamic = "force-static";

// アイコンの<link>を読まないもの(RSSリーダーなど)が取りに来る
export async function GET() {
  const body = ico(await iconPng(33), 33);
  return new Response(new Uint8Array(body), {
    headers: { "content-type": "image/x-icon" },
  });
}
