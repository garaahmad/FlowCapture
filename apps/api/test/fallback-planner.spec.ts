import { describe, expect, it, vi } from "vitest";
import { FallbackPlanner } from "../src/modules/planning/fallback.planner";
import type { PlannerProvider } from "../src/modules/planning/planner.provider";

const input = { message: "Summarize my API", timezone: "UTC", history: [] };

describe("FallbackPlanner", () => {
  it("does not call the fallback after a successful primary response", async () => {
    const primary = { kind: "llm", generate: vi.fn().mockResolvedValue({ name: "primary" }) } as unknown as PlannerProvider;
    const fallback = { kind: "llm", generate: vi.fn() } as unknown as PlannerProvider;
    await expect(new FallbackPlanner(primary, fallback).generate(input)).resolves.toEqual({ name: "primary" });
    expect(fallback.generate).not.toHaveBeenCalled();
  });

  it("uses the explicitly configured fallback once after primary failure", async () => {
    const primary = { kind: "llm", generate: vi.fn().mockRejectedValue(new Error("unavailable")) } as unknown as PlannerProvider;
    const fallback = { kind: "llm", generate: vi.fn().mockResolvedValue({ name: "fallback" }) } as unknown as PlannerProvider;
    await expect(new FallbackPlanner(primary, fallback).generate(input)).resolves.toEqual({ name: "fallback" });
    expect(primary.generate).toHaveBeenCalledTimes(1);
    expect(fallback.generate).toHaveBeenCalledTimes(1);
  });
});
