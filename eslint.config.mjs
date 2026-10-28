import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/*.config.js",
      "apps/web/next-env.d.ts",
    ],
  },
  {
    files: ["apps/web/**/*.{ts,tsx}", "apps/web/*.mjs"],
    extends: [...nextVitals],
    settings: { next: { rootDir: "apps/web" } },
  },
  {
    files: [
      "apps/api/**/*.ts",
      "packages/**/*.ts",
      "services/**/*.ts",
      "*.ts",
    ],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
);
