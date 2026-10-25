import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: { mode: "auto" },
});

/** 本番と開発モードで同じ設定 */
const shared: NextConfig = {
  trailingSlash: true,
  transpilePackages: [
    "@portfolio/design",
    "@portfolio/pxcat",
    "@portfolio/content-wasm",
    "@portfolio/markdown",
  ],
  // Mermaidの図をビルド時に描くChromiumの操作は、バンドルせずにそのまま読む
  serverExternalPackages: ["playwright-core"],
};

/** 本番は静的なファイルに書き出す(ロリポップに置く) */
const config: NextConfig = { ...shared, output: "export" };

/** 開発モードの管理画面の相手(scripts/dev-admin.mjs) */
const DEV_ADMIN = `http://127.0.0.1:${process.env.DEV_ADMIN_PORT ?? "4300"}`;

/**
 * 開発モード(pnpm dev)だけ、管理画面のログインと中継を、手元の相手に回す。
 * 本番(static export)にはこの設定は入らない。Workerには手を入れない
 */
const dev: NextConfig = {
  ...shared,
  rewrites: () =>
    Promise.resolve([
      {
        source: "/admin/auth/:rest*",
        destination: `${DEV_ADMIN}/admin/auth/:rest*`,
      },
      { source: "/admin/api", destination: `${DEV_ADMIN}/admin/api` },
      { source: "/admin/api/", destination: `${DEV_ADMIN}/admin/api` },
      { source: "/admin/qiita", destination: `${DEV_ADMIN}/admin/qiita` },
      { source: "/admin/qiita/", destination: `${DEV_ADMIN}/admin/qiita` },
    ]),
};

export default function nextConfig(phase: string) {
  return withVanillaExtract(phase === PHASE_DEVELOPMENT_SERVER ? dev : config);
}
