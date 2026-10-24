import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/.next/", "**/out/", "**/next-env.d.ts", "target/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["apps/web/**"],
    extends: [nextVitals],
    settings: { next: { rootDir: "apps/web" } },
  },
  prettier,
]);
