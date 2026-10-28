import { z } from "zod";

export type NodeRisk = "low" | "moderate" | "high";
export type NodeMaturity = "schema_only" | "executable";

export interface NodeDefinition {
  type: string;
  version: 1;
  label: string;
  description: string;
  category: "trigger" | "source" | "transform" | "action";
  maturity: NodeMaturity;
  sideEffect: boolean;
  risk: NodeRisk;
  credentialType?: "http_api" | "google";
  configSchema: z.ZodType;
  outputSchema: z.ZodType;
  timeoutMs: number;
  maxSafeAttempts: number;
}

const emptyConfig = z.object({}).strict();

export const NODE_REGISTRY: readonly NodeDefinition[] = [
  {
    type: "manual.trigger",
    version: 1,
    label: "Manual trigger",
    description: "Starts a workflow only after an explicit user dispatch.",
    category: "trigger",
    maturity: "schema_only",
    sideEffect: false,
    risk: "low",
    configSchema: emptyConfig,
    outputSchema: z.object({ triggeredAt: z.string().datetime() }).strict(),
    timeoutMs: 1000,
    maxSafeAttempts: 1,
  },
  {
    type: "schedule.trigger",
    version: 1,
    label: "Schedule",
    description: "Starts a workflow on an hourly, daily, or weekly local schedule.",
    category: "trigger",
    maturity: "schema_only",
    sideEffect: false,
    risk: "low",
    configSchema: emptyConfig,
    outputSchema: z.object({ scheduledFor: z.string().datetime() }).strict(),
    timeoutMs: 1000,
    maxSafeAttempts: 1,
  },
  {
    type: "http.get",
    version: 1,
    label: "HTTP GET",
    description: "Reads JSON from an allowlisted public HTTPS endpoint.",
    category: "source",
    maturity: "schema_only",
    sideEffect: false,
    risk: "moderate",
    credentialType: "http_api",
    configSchema: z
      .object({
        url: z.string().url().max(2048),
        connectionId: z.string().uuid().optional(),
        headers: z.record(z.string(), z.string().max(2000)).optional(),
      })
      .strict(),
    outputSchema: z
      .object({
        status: z.number().int(),
        body: z.unknown(),
        headers: z.record(z.string(), z.string()),
      })
      .strict(),
    timeoutMs: 20_000,
    maxSafeAttempts: 2,
  },
  {
    type: "map.fields",
    version: 1,
    label: "Map fields",
    description: "Creates a new object from static values and prior-step references.",
    category: "transform",
    maturity: "schema_only",
    sideEffect: false,
    risk: "low",
    configSchema: z
      .object({ fields: z.record(z.string(), z.unknown()) })
      .strict(),
    outputSchema: z.record(z.string(), z.unknown()),
    timeoutMs: 1000,
    maxSafeAttempts: 1,
  },
] as const;

export function getNodeDefinition(type: string, version = 1): NodeDefinition | undefined {
  return NODE_REGISTRY.find((node) => node.type === type && node.version === version);
}

export function getExecutableNodes(): NodeDefinition[] {
  return NODE_REGISTRY.filter((node) => node.maturity === "executable");
}
