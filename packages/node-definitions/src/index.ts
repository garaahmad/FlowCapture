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
  requiredScopes?: string[];
  planningSupported?: boolean;
  requiredFields?: Array<{
    path: string;
    kind: "url" | "email" | "text";
    question: string;
  }>;
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
    requiredFields: [{ path: "url", kind: "url", question: "What public HTTPS URL should this step read?" }],
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
  {
    type: "ai.summarize",
    version: 1,
    label: "AI summarize",
    description: "Summarizes supplied text with bounded instructions and no tool access.",
    category: "transform",
    maturity: "schema_only",
    sideEffect: false,
    risk: "moderate",
    configSchema: z.object({
      input: z.string().max(100_000).optional(),
      instructions: z.string().max(2000).optional(),
      maxWords: z.number().int().min(20).max(1000).optional(),
    }).strict(),
    outputSchema: z.object({ text: z.string() }).strict(),
    timeoutMs: 30_000,
    maxSafeAttempts: 1,
  },
  {
    type: "gmail.send",
    version: 1,
    label: "Gmail send",
    description: "Sends email to an explicitly approved recipient through an authorized Google connection.",
    category: "action",
    maturity: "schema_only",
    sideEffect: true,
    risk: "high",
    credentialType: "google",
    requiredScopes: ["https://www.googleapis.com/auth/gmail.send"],
    requiredFields: [{ path: "to", kind: "email", question: "What email address should receive this message?" }],
    configSchema: z.object({
      connectionId: z.string().uuid().optional(),
      to: z.string().email().max(320),
      subject: z.string().max(200),
      body: z.string().max(100_000),
    }).strict(),
    outputSchema: z.object({ providerMessageId: z.string() }).strict(),
    timeoutMs: 20_000,
    maxSafeAttempts: 1,
  },
  {
    type: "sheets.read",
    version: 1,
    label: "Google Sheets read",
    description: "Reads a bounded range from an authorized spreadsheet.",
    category: "source",
    maturity: "schema_only",
    sideEffect: false,
    risk: "moderate",
    credentialType: "google",
    requiredScopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    requiredFields: [
      { path: "spreadsheetId", kind: "text", question: "What is the Google Sheets spreadsheet ID?" },
      { path: "range", kind: "text", question: "Which sheet range should be read, such as Sheet1!A1:Z1000?" },
    ],
    configSchema: z.object({
      connectionId: z.string().uuid().optional(),
      spreadsheetId: z.string().min(10).max(200),
      range: z.string().min(1).max(200),
    }).strict(),
    outputSchema: z.object({ values: z.array(z.array(z.unknown())) }).strict(),
    timeoutMs: 20_000,
    maxSafeAttempts: 2,
  },
  {
    type: "sheets.append",
    version: 1,
    label: "Google Sheets append",
    description: "Appends explicitly mapped values to an authorized spreadsheet.",
    category: "action",
    maturity: "schema_only",
    sideEffect: true,
    risk: "moderate",
    credentialType: "google",
    requiredScopes: ["https://www.googleapis.com/auth/spreadsheets"],
    requiredFields: [
      { path: "spreadsheetId", kind: "text", question: "What is the Google Sheets spreadsheet ID?" },
      { path: "range", kind: "text", question: "Which sheet range should receive appended rows?" },
    ],
    configSchema: z.object({
      connectionId: z.string().uuid().optional(),
      spreadsheetId: z.string().min(10).max(200),
      range: z.string().min(1).max(200),
      values: z.array(z.unknown()).max(100),
    }).strict(),
    outputSchema: z.object({ appendedRows: z.number().int().nonnegative() }).strict(),
    timeoutMs: 20_000,
    maxSafeAttempts: 1,
  },
] as const;

export function getNodeDefinition(type: string, version = 1): NodeDefinition | undefined {
  return NODE_REGISTRY.find((node) => node.type === type && node.version === version);
}

export function getExecutableNodes(): NodeDefinition[] {
  return NODE_REGISTRY.filter((node) => node.maturity === "executable");
}

export function getPlanningNodes(): NodeDefinition[] {
  return NODE_REGISTRY.filter((node) => node.planningSupported !== false);
}
