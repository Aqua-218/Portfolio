import { createVanillaExtractPlugin } from "@vanilla-extract/next-plugin";
import type { NextConfig } from "next";

const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: { mode: "auto" },
});

const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@portfolio/design", "@portfolio/pxcat"],
};

export default withVanillaExtract(config);
