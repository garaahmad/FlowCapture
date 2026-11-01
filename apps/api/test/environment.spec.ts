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

  it("accepts explicitly configured Gemini primary and Groq fallback providers", () => {
    const result = validateEnvironment({
      ...base,
      NODE_ENV: "production",
      ALLOW_PREVIEW_ORIGINS: "false",
      PLANNER_MODE: "gemini",
      PLANNER_FALLBACK_MODE: "groq",
      GEMINI_API_KEY: "gemini-test-key",
      GROQ_API_KEY: "groq-test-key",
    });
    expect(result.GEMINI_MODEL).toBe("gemini-3.8-flash");
    expect(result.GROQ_MODEL).toBe("openai/gpt-oss-20b");
  });

  it("fails closed when an enabled production provider has no credential", () => {
    expect(() => validateEnvironment({
      ...base,
      NODE_ENV: "production",
      ALLOW_PREVIEW_ORIGINS: "false",
      PLANNER_MODE: "gemini",
    })).toThrow("gemini API key");
  });

  it("rejects duplicate or meaningless fallback configuration", () => {
    expect(() => validateEnvironment({ ...base, PLANNER_MODE: "gemini", PLANNER_FALLBACK_MODE: "gemini" })).toThrow("must differ");
    expect(() => validateEnvironment({ ...base, PLANNER_MODE: "deterministic", PLANNER_FALLBACK_MODE: "groq" })).toThrow("remote primary");
  });

  it("parses explicit origin allowlists", () => {
    expect(configuredOrigins("https://app.example.com, https://admin.example.com")).toEqual([
      "https://app.example.com",
      "https://admin.example.com",
    ]);
  });
});
