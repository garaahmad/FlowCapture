import type {
  AutomationPlanDefinition,
  PlannerIntent,
} from "@flowcapture/workflow-schema";

export const PLANNER_PROVIDER = Symbol("PLANNER_PROVIDER");

export interface PlannerInput {
  message: string;
  timezone: string;
  currentPlan?: AutomationPlanDefinition;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface PlannerProvider {
  readonly kind: "deterministic" | "llm";
  generate(input: PlannerInput): Promise<PlannerIntent>;
}

export class PlannerUnavailableError extends Error {
  constructor(message = "The planner is not configured for this environment.") {
    super(message);
    this.name = "PlannerUnavailableError";
  }
}
