import { readdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** out/にある全部のページ(エラーの画面・管理画面・ライセンスの原文も) */
function pages(): string[] {
  const out = new URL("../out/", import.meta.url).pathname;
  return readdirSync(out, { recursive: true, encoding: "utf8" })
    .filter((f) => f === "index.html" || f.endsWith("/index.html"))
    .map((f) => `/${f.replace(/index\.html$/, "")}`)
    .filter((p) => !p.startsWith("/_not-found/"))
    .sort();
}

// 色の組み合わせが変わるので、ライトとダークの両方で見る
for (const colorScheme of ["light", "dark"] as const) {
  for (const path of pages()) {
    test(`${path}(${colorScheme})にaxeの違反がない`, async ({ page }) => {
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page })
        // 埋め込み(YouTube・Xなど)の中は、よそのページなので見ない
        .exclude("iframe")
        .analyze();
      expect(
        violations.flatMap((v) =>
          v.nodes.map((n) => {
            // コントラストは、色と比も出す
            const c = n.any[0]?.data as
              | { fgColor?: string; bgColor?: string; contrastRatio?: number }
              | undefined;
            const colors = c?.fgColor
              ? ` ${c.fgColor} / ${String(c.bgColor)} = ${String(c.contrastRatio)}`
              : "";
            return `${v.id}: ${n.target.join(" ")}${colors}`;
          }),
        ),
      ).toEqual([]);
    });
  }
}
