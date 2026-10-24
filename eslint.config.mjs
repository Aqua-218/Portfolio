import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/.next/", "**/out/", "**/next-env.d.ts", "target/"]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    // 色・書体・角丸はテーマ(vars)からだけ使う
    files: ["apps/web/**/*.css.ts"],
    ignores: ["apps/web/src/styles/theme.css.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/#[0-9a-fA-F]{3,8}\\b|\\b(rgba?|hsla?|hwb|oklch|oklab|lab|lch|color)\\(/]",
          message: "色はvars.colorから使う",
        },
        {
          selector:
            "Property[key.name=/^(color|background|backgroundColor|borderColor|outlineColor|fill|stroke|fontFamily|borderRadius)$/] > Literal[value!=/^(inherit|currentColor|transparent|none|0)$/]",
          message: "色・書体・角丸はテーマのvarsから使う",
        },
      ],
    },
  },
  {
    files: ["apps/web/**"],
    extends: [nextVitals],
    settings: { next: { rootDir: "apps/web" } },
  },
  prettier,
]);
