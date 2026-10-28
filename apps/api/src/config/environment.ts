import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

export const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  WEB_ORIGINS: z.string().default("http://localhost:3000"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  COOKIE_SECURE: booleanFromString.optional(),
  TRUST_PROXY: booleanFromString.default(false),
  ALLOW_PREVIEW_ORIGINS: booleanFromString.default(true),
  SWAGGER_ENABLED: booleanFromString.optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(30),
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().max(320).optional(),
  PLANNER_MODE: z.enum(["disabled", "deterministic", "openai"]).default("disabled"),
  LLM_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().max(200).optional(),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1000).max(60_000).default(30_000),
  LLM_MAX_RETRIES: z.coerce.number().int().min(0).max(2).default(1),
});

export type AppEnvironment = z.infer<typeof environmentSchema>;

export function validateEnvironment(environment: Record<string, unknown>): AppEnvironment {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid API environment configuration: ${fields}`);
  }
  if (parsed.data.NODE_ENV === "production") {
    if (parsed.data.ALLOW_PREVIEW_ORIGINS) {
      throw new Error("ALLOW_PREVIEW_ORIGINS must be false in production");
    }
    if (parsed.data.SMTP_URL && !parsed.data.MAIL_FROM) {
      throw new Error("MAIL_FROM is required when SMTP_URL is configured");
    }
    if (parsed.data.PLANNER_MODE === "deterministic") {
      throw new Error("Deterministic planning is development-only; configure openai or disabled in production");
    }
    if (parsed.data.PLANNER_MODE === "openai" && (!parsed.data.LLM_API_KEY || !parsed.data.LLM_MODEL)) {
      throw new Error("LLM_API_KEY and LLM_MODEL are required for OpenAI planning");
    }
  }
  return parsed.data;
}

export function configuredOrigins(value: string): string[] {
  return value.split(",").map((origin) => origin.trim()).filter(Boolean);
}
