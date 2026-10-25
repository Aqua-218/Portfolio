import { expect, test } from "@playwright/test";

const IMMUTABLE = "public, max-age=31536000, immutable";

test("ページは毎回確かめ、名前にハッシュの入るファイルは1年持たせる", async ({
  page,
  request,
}) => {
  const assets = new Map<string, string>();
  page.on("response", (res) => {
    const { pathname } = new URL(res.url());
    if (/^\/(_next\/static|img\/cats|fonts)\//.test(pathname))
      assets.set(pathname, res.headers()["cache-control"] ?? "");
  });
  const res = await page.goto("/");
  expect(res?.headers()["cache-control"]).toBe("no-cache");
  await page.waitForLoadState("networkidle");

  // JS・CSS・写真がそろっている
  const paths = [...assets.keys()];
  expect(paths.some((p) => p.endsWith(".js"))).toBe(true);
  expect(paths.some((p) => p.endsWith(".css"))).toBe(true);
  expect(paths.some((p) => p.startsWith("/img/cats/"))).toBe(true);
  for (const [path, cache] of assets) expect(cache, path).toBe(IMMUTABLE);

  // 名前にハッシュの入らないファイルは、ページと同じく毎回確かめる
  const robots = await request.get("/robots.txt");
  expect(robots.headers()["cache-control"]).toBe("no-cache");
});

test("管理画面は残さない", async ({ request }) => {
  const res = await request.get("/admin/");
  expect(res.headers()["cache-control"]).toBe("no-store");
});
