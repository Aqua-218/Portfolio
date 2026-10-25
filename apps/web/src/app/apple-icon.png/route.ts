import { iconPng } from "@/lib/icon";

export const dynamic = "force-static";

// iPhoneのホーム画面に置いたとき
export async function GET() {
  return new Response(new Uint8Array(await iconPng(176)), {
    headers: { "content-type": "image/png" },
  });
}
