import { z } from "zod";

export const WORKFLOW_SCHEMA_VERSION = 1;
export const MAX_WORKFLOW_STEPS = 25;

const nodeIdSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,39}$/, "Use a lowercase identifier such as fetch_news.");

const timezoneSchema = z.string().max(100).refine(isValidTimezone, {
  message: "Must be a valid IANA timezone.",
});

export function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const scheduleConfigSchema = z
  .object({
    frequency: z.enum(["hourly", "daily", "weekly"]),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    timezone: timezoneSchema,
    weekdays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  })
  .strict()
  .superRefine((config, context) => {
    if (config.frequency !== "hourly" && !config.time) {
      context.addIssue({
        code: "custom",
        path: ["time"],
        message: "Daily and weekly schedules require a local time.",
      });
    }
    if (config.frequency === "hourly" && (config.time || config.weekdays)) {
      context.addIssue({
        code: "custom",
        message: "Hourly schedules do not accept time or weekdays.",
      });
    }
    if (config.frequency === "weekly" && !config.weekdays?.length) {
      context.addIssue({
        code: "custom",
        path: ["weekdays"],
        message: "Weekly schedules require at least one weekday.",
      });
    }
    if (config.weekdays && new Set(config.weekdays).size !== config.weekdays.length) {
      context.addIssue({
        code: "custom",
        path: ["weekdays"],
        message: "Weekdays must be unique.",
      });
    }
  });

export const workflowTriggerSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("manual.trigger"),
      version: z.literal(1),
      config: z.object({}).strict(),
    })
    .strict(),
  z
    .object({
      type: z.literal("schedule.trigger"),
      version: z.literal(1),
      config: scheduleConfigSchema,
    })
    .strict(),
]);

export const workflowStepSchema = z
  .object({
    id: nodeIdSchema,
    type: z.string().regex(/^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/),
    version: z.number().int().positive(),
    label: z.string().trim().min(1).max(100),
    config: z.record(z.string(), z.unknown()),
    dependsOn: z.array(nodeIdSchema).max(MAX_WORKFLOW_STEPS).optional(),
  })
  .strict();

export const executionPolicySchema = z
  .object({
    timeoutMs: z.number().int().min(1000).max(120_000).default(30_000),
    maxResponseBytes: z.number().int().min(1024).max(2_000_000).default(1_000_000),
    maxAttempts: z.number().int().min(1).max(3).default(1),
  })
  .strict()
  .default({ timeoutMs: 30_000, maxResponseBytes: 1_000_000, maxAttempts: 1 });

export const workflowDefinitionSchema = z
  .object({
    schemaVersion: z.literal(WORKFLOW_SCHEMA_VERSION),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(1000),
    trigger: workflowTriggerSchema,
    steps: z.array(workflowStepSchema).min(1).max(MAX_WORKFLOW_STEPS),
    policy: executionPolicySchema,
  })
  .strict()
  .superRefine((definition, context) => {
    const seen = new Set<string>();
    for (const [index, step] of definition.steps.entries()) {
      if (seen.has(step.id)) {
        context.addIssue({
          code: "custom",
          path: ["steps", index, "id"],
          message: `Duplicate step id: ${step.id}`,
        });
      }
      for (const dependency of step.dependsOn ?? []) {
        if (!seen.has(dependency)) {
          context.addIssue({
            code: "custom",
            path: ["steps", index, "dependsOn"],
            message: `Dependency ${dependency} must be an earlier step.`,
          });
        }
      }
      for (const reference of collectStepReferences(step.config)) {
        if (!seen.has(reference.stepId)) {
          context.addIssue({
            code: "custom",
            path: ["steps", index, "config"],
            message: `Reference ${reference.stepId} must point to an earlier step.`,
          });
        }
      }
      seen.add(step.id);
    }
  });

export type WorkflowDefinition = z.infer<typeof workflowDefinitionSchema>;
export type WorkflowTrigger = z.infer<typeof workflowTriggerSchema>;
export type WorkflowStep = z.infer<typeof workflowStepSchema>;

export interface StepReference {
  expression: string;
  stepId: string;
  outputPath: string;
}

const REFERENCE_PATTERN = /\{\{steps\.([a-z][a-z0-9_]{0,39})\.([a-zA-Z0-9_.-]{1,150})\}\}/g;

export function collectStepReferences(value: unknown): StepReference[] {
  const references: StepReference[] = [];
  visitReferences(value, references);
  return references;
}

function visitReferences(value: unknown, references: StepReference[]): void {
  if (typeof value === "string") {
    for (const match of value.matchAll(REFERENCE_PATTERN)) {
      const [expression, stepId, outputPath] = match;
      if (stepId && outputPath) {
        references.push({ expression, stepId, outputPath });
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) visitReferences(item, references);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) visitReferences(item, references);
  }
}

export const workflowDefinitionJsonSchema = z.toJSONSchema(
  workflowDefinitionSchema,
  { io: "input", unrepresentable: "throw" },
);
