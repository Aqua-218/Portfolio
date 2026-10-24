import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** out/にあるページ。404・エラーの画面・管理画面は除く */
function pages(): string[] {
  const out = new URL("../out/", import.meta.url).pathname;
  return readdirSync(out, { recursive: true, encoding: "utf8" })
    .filter((f) => f === "index.html" || f.endsWith("/index.html"))
    .map((f) => `/${f.replace(/index\.html$/, "")}`)
    .filter((p) => !/^\/(404|_not-found|admin|errors)\//.test(p))
    .sort();
}

test("sitemap.xmlに全ページが載っている", async ({ request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  const listed = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, loc = ""]) => new URL(loc).pathname)
    .sort();
  expect(listed).toEqual(pages());
});

test("robots.txtは管理画面を外し、sitemap.xmlを指す", async ({ request }) => {
  const txt = await (await request.get("/robots.txt")).text();
  expect(txt).toContain("Disallow: /admin/");
  expect(txt).toMatch(/^Sitemap: https:\/\/.+\/sitemap\.xml$/m);
});
