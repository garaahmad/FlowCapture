import { describe, expect, it } from "vitest";
import { DeterministicPlanner } from "../src/modules/planning/deterministic.planner";
import { FeasibilityService } from "../src/modules/planning/feasibility.service";

const planner = new DeterministicPlanner();
const feasibility = new FeasibilityService();
const input = (message: string) => ({ message, timezone: "Asia/Jerusalem", history: [] });

describe("grounded deterministic planning evaluations", () => {
  it("plans an English scheduled API summary and asks only for a missing recipient", async () => {
    const intent = await planner.generate(input(
      "Every weekday at 8 AM, read https://example.com/news.json, summarize it and email the result",
    ));
    const plan = feasibility.buildPlan(intent, "deterministic");
    expect(plan.trigger).toMatchObject({ type: "schedule.trigger", config: { frequency: "weekly", time: "08:00", weekdays: [1, 2, 3, 4, 5] } });
    expect(plan.steps.map((step) => step.type)).toEqual(["http.get", "ai.summarize", "gmail.send"]);
    expect(plan.questions).toHaveLength(1);
    expect(plan.questions[0]).toMatchObject({ stepId: "send", kind: "email" });
    expect(plan.sideEffects).toHaveLength(1);
    expect(plan.runtimeReady).toBe(false);

    const answered = await planner.generate({
      message: "person@example.com",
      timezone: "Asia/Jerusalem",
      history: [],
      currentPlan: plan,
    });
    const revised = feasibility.buildPlan(answered, "deterministic");
    expect(revised.questions).toEqual([]);
    expect(revised.feasibility).toBe("supported");
    expect(revised.steps).toHaveLength(3);
  });

  it("plans a supported Arabic request with the workspace timezone", async () => {
    const intent = await planner.generate(input(
      "كل يوم الساعة 08:00، اقرأ من https://example.com/news ثم لخص النتائج",
    ));
    const plan = feasibility.buildPlan(intent, "deterministic");
    expect(plan.feasibility).toBe("supported");
    expect(plan.trigger.config).toMatchObject({ time: "08:00", timezone: "Asia/Jerusalem" });
    expect(plan.steps.map((step) => step.type)).toEqual(["http.get", "ai.summarize"]);
  });

  it("clarifies a missing schedule time without discarding actions", async () => {
    const intent = await planner.generate(input("Daily, read https://example.com/data.json and summarize it"));
    const plan = feasibility.buildPlan(intent, "deterministic");
    expect(plan.questions[0]?.id).toBe("trigger:time");
    const answered = await planner.generate({ message: "at 6:30 PM", timezone: "UTC", history: [], currentPlan: plan });
    const revised = feasibility.buildPlan(answered, "deterministic");
    expect(revised.trigger.config).toMatchObject({ time: "18:30" });
    expect(revised.steps).toHaveLength(2);
    expect(revised.questions).toEqual([]);
  });

  it("ignores digits inside URLs when parsing a later schedule time", async () => {
    const intent = await planner.generate(input("Daily, read https://example.com/v2/data.json and summarize it at 6 PM"));
    expect(intent.trigger).toMatchObject({ type: "schedule.trigger", config: { time: "18:00" } });
  });

  it("rejects arbitrary browser automation instead of inventing a node", async () => {
    const intent = await planner.generate(input("Every day, control my mobile app in a browser"));
    const plan = feasibility.buildPlan(intent, "deterministic");
    expect(plan.feasibility).toBe("unsupported");
    expect(plan.steps).toEqual([]);
  });
});
