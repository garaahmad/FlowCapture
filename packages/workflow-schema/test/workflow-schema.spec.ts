import { describe, expect, it } from "vitest";
import {
  collectStepReferences,
  isValidTimezone,
  workflowDefinitionJsonSchema,
  workflowDefinitionSchema,
} from "../src";

const validWorkflow = {
  schemaVersion: 1,
  name: "News digest",
  description: "Read public news and prepare the selected fields.",
  trigger: {
    type: "schedule.trigger",
    version: 1,
    config: { frequency: "daily", time: "08:00", timezone: "Asia/Jerusalem" },
  },
  steps: [
    {
      id: "fetch",
      type: "http.get",
      version: 1,
      label: "Fetch news",
      config: { url: "https://example.com/news.json" },
    },
    {
      id: "map",
      type: "map.fields",
      version: 1,
      label: "Select fields",
      config: { fields: { headlines: "{{steps.fetch.body}}" } },
    },
  ],
  policy: {},
} as const;

describe("workflowDefinitionSchema", () => {
  it("applies bounded execution defaults and accepts prior-step references", () => {
    const result = workflowDefinitionSchema.parse(validWorkflow);
    expect(result.policy).toEqual({
      timeoutMs: 30_000,
      maxResponseBytes: 1_000_000,
      maxAttempts: 1,
    });
    expect(collectStepReferences(result.steps[1]?.config)).toEqual([
      { expression: "{{steps.fetch.body}}", stepId: "fetch", outputPath: "body" },
    ]);
  });

  it("rejects references to later steps", () => {
    const invalid = structuredClone(validWorkflow);
    invalid.steps.reverse();
    const result = workflowDefinitionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.message.includes("earlier step"))).toBe(true);
  });

  it("rejects duplicate step identifiers", () => {
    const invalid = structuredClone(validWorkflow);
    invalid.steps[1].id = "fetch";
    expect(workflowDefinitionSchema.safeParse(invalid).success).toBe(false);
  });

  it("requires weekdays for weekly schedules", () => {
    const invalid = structuredClone(validWorkflow);
    invalid.steps = invalid.steps.slice(0, 1);
    invalid.trigger.config = {
      frequency: "weekly",
      time: "08:00",
      timezone: "UTC",
    };
    expect(workflowDefinitionSchema.safeParse(invalid).success).toBe(false);
  });

  it("exports a serializable JSON schema", () => {
    expect(workflowDefinitionJsonSchema.type).toBe("object");
    expect(() => JSON.stringify(workflowDefinitionJsonSchema)).not.toThrow();
  });
});

describe("isValidTimezone", () => {
  it("accepts IANA names and rejects arbitrary offsets", () => {
    expect(isValidTimezone("Asia/Jerusalem")).toBe(true);
    expect(isValidTimezone("not/a-timezone")).toBe(false);
  });
});
