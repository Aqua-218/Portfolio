import { expect, test } from "@playwright/test";

test("サイトのアイコンがあり、favicon.icoを探して404にならない", async ({
  page,
  request,
}) => {
  const missing: string[] = [];
  page.on("response", (res) => {
    if (res.status() === 404) missing.push(res.url());
  });
  await page.goto("/");
  await expect(
    page.locator('link[rel="icon"][type="image/svg+xml"]'),
  ).toHaveAttribute("href", "/icon.svg");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/apple-icon.png",
  );

  const svg = await request.get("/icon.svg");
  expect(svg.headers()["content-type"]).toBe("image/svg+xml");
  expect(await svg.text()).toMatch(
    /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/,
  );

  // ICOの頭(予約0・種類1)と、中のPNG
  const ico = await (await request.get("/favicon.ico")).body();
  expect([...ico.subarray(0, 4)]).toEqual([0, 0, 1, 0]);
  expect(ico.subarray(22, 26).toString("latin1")).toBe("\x89PNG");

  const png = await (await request.get("/apple-icon.png")).body();
  expect(png.subarray(0, 4).toString("latin1")).toBe("\x89PNG");

  await page.waitForLoadState("networkidle");
  expect(missing).toEqual([]);
});
