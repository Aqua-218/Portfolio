import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
import type { NextConfig } from "next";

const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: { mode: "auto" },
});

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@portfolio/design", "@portfolio/pxcat"],
  // Mermaidの図をビルド時に描くChromiumの操作は、バンドルせずにそのまま読む
  serverExternalPackages: ["playwright-core"],
};

export default withVanillaExtract(config);
