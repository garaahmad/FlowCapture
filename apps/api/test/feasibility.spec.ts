import { describe, expect, it } from "vitest";
import { plannerIntentSchema } from "@flowcapture/workflow-schema";
import { FeasibilityService } from "../src/modules/planning/feasibility.service";

describe("independent feasibility validation", () => {
  it("rejects invented nodes and later-step references", () => {
    const intent = plannerIntentSchema.parse({
      schemaVersion: 1,
      name: "Unsafe",
      purpose: "Test unsupported capabilities",
      trigger: { type: "manual.trigger", version: 1, config: {} },
      actions: [
        { id: "send", type: "gmail.send", version: 1, label: "Send", config: { to: "person@example.com", subject: "Test", body: "{{steps.fetch.body}}" } },
        { id: "invented", type: "browser.control", version: 1, label: "Invented", config: {} },
      ],
      unsupportedSteps: [], assumptions: [], dataRead: [], dataWritten: [], timingUnknowns: [],
    });
    const plan = new FeasibilityService().buildPlan(intent, "llm");
    expect(plan.feasibility).toBe("unsupported");
    expect(plan.unsupportedSteps.some((step) => step.includes("later step"))).toBe(true);
    expect(plan.unsupportedSteps.some((step) => step.includes("browser.control"))).toBe(true);
    expect(plan.runtimeReady).toBe(false);
  });
});
