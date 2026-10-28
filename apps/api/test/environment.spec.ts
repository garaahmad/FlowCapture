import { describe, expect, it } from "vitest";
import { configuredOrigins, validateEnvironment } from "../src/config/environment";

const base = {
  NODE_ENV: "test",
  DATABASE_URL: "postgresql://example.invalid/flowcapture",
};

describe("environment validation", () => {
  it("uses bounded safe development defaults", () => {
    const result = validateEnvironment(base);
    expect(result.PORT).toBe(3001);
    expect(result.SESSION_TTL_DAYS).toBe(30);
    expect(result.TRUST_PROXY).toBe(false);
  });

  it("fails closed when production preview origins are enabled", () => {
    expect(() => validateEnvironment({
      ...base,
      NODE_ENV: "production",
      ALLOW_PREVIEW_ORIGINS: "true",
    })).toThrow("ALLOW_PREVIEW_ORIGINS");
  });

  it("parses explicit origin allowlists", () => {
    expect(configuredOrigins("https://app.example.com, https://admin.example.com")).toEqual([
      "https://app.example.com",
      "https://admin.example.com",
    ]);
  });
});
