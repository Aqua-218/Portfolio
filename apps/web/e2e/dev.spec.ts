import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** 開発モード(pnpm dev)だけのものの目印。本番の書き出しに1つもあってはいけない */
const MARKS = ["開発メニュー", "開発モード", "127.0.0.1:4300", "dev-admin"];

test("本番の書き出しには、開発モードのものが入っていない", () => {
  const out = new URL("../out/", import.meta.url).pathname;
  const files = readdirSync(out, { recursive: true, encoding: "utf8" }).filter(
    (f) => /\.(html|js|txt|css|json)$/.test(f),
  );
  expect(files.length).toBeGreaterThan(10);
  const found = files.flatMap((f) => {
    const text = readFileSync(out + f, "utf8");
    return MARKS.filter((m) => text.includes(m)).map((m) => `${f}: ${m}`);
  });
  expect(found).toEqual([]);
});

test("本番では開発メニューを出さない", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("complementary", { name: "開発メニュー" }),
  ).toHaveCount(0);
});
