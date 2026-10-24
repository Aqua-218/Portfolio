import { defineConfig, devices } from "@playwright/test";

// 見た目テスト。フォントの描画をそろえるため、Dockerの中で回す(pnpm vrt)
export default defineConfig({
  testDir: "vrt",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? "github" : "list",
  expect: {
    toHaveScreenshot: { animations: "disabled", maxDiffPixels: 0 },
  },
  use: {
    baseURL: "http://localhost:4173",
    // 猫の瞬きや幕を止めて、毎回同じ画にする
    reducedMotion: "reduce",
  },
  projects: [
    {
      name: "light-pc",
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      name: "dark-pc",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
    { name: "light-sp", use: { ...devices["Pixel 7"], colorScheme: "light" } },
    { name: "dark-sp", use: { ...devices["Pixel 7"], colorScheme: "dark" } },
  ],
  webServer: {
    command: "node e2e/serve.mjs",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
  },
});
