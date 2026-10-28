import { describe, expect, it } from "vitest";
import { automationPlanDefinitionSchema } from "@flowcapture/workflow-schema";
import { canonicalJson, hashPlanDefinition } from "../src/modules/planning/plan-hash";
import { redactPotentialSecrets } from "../src/modules/planning/redaction";
import { DeterministicPlanner } from "../src/modules/planning/deterministic.planner";
import { FeasibilityService } from "../src/modules/planning/feasibility.service";
import { isReusablePlan } from "../src/modules/planning/conversations.service";

describe("planning security primitives", () => {
  it("redacts likely secrets before persistence or provider calls", () => {
    const result = redactPotentialSecrets("Use api_key=very-secret-value and Bearer abcdef123456 and sk-abcdefghijklmn");
    expect(result.redacted).toBe(true);
    expect(result.content).not.toContain("very-secret-value");
    expect(result.content).not.toContain("abcdef123456");
    expect(result.content).not.toContain("sk-abcdefghijklmn");
  });

  it("requires a fresh version after changes are requested, even for identical content", () => {
    const plan = { contentHash: "a".repeat(64), status: "CHANGES_REQUESTED" };
    expect(isReusablePlan(plan, plan.contentHash)).toBe(false);
    expect(isReusablePlan({ ...plan, status: "APPROVED" }, plan.contentHash)).toBe(true);
    expect(isReusablePlan(plan, "b".repeat(64))).toBe(false);
  });

  it("hashes canonical JSON independently of object key order", async () => {
    const intent = await new DeterministicPlanner().generate({
      message: "Read https://example.com/data.json and summarize it",
      timezone: "UTC",
      history: [],
    });
    const plan = new FeasibilityService().buildPlan(intent, "deterministic");
    const reordered = automationPlanDefinitionSchema.parse(Object.fromEntries(Object.entries(plan).reverse()));
    expect(canonicalJson({ b: 1, a: 2 })).toBe(canonicalJson({ a: 2, b: 1 }));
    expect(hashPlanDefinition(plan)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashPlanDefinition(reordered)).toBe(hashPlanDefinition(plan));
  });
});
