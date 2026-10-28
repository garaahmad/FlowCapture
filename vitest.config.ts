import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/*/test/**/*.spec.ts",
      "apps/api/test/**/*.spec.ts",
      "apps/web/test/**/*.spec.{ts,tsx}",
    ],
    exclude: ["**/*.integration.spec.ts", "**/node_modules/**", "**/dist/**"],
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    coverage: {
      reporter: ["text", "json-summary"],
    },
  },
});
