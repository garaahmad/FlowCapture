import { Logger } from "@nestjs/common";
import type { PlannerIntent } from "@flowcapture/workflow-schema";
import type { PlannerInput, PlannerProvider } from "./planner.provider";

/** Uses an explicitly configured remote fallback after the primary provider fails. */
export class FallbackPlanner implements PlannerProvider {
  readonly kind = "llm" as const;
  private readonly logger = new Logger(FallbackPlanner.name);

  constructor(
    private readonly primary: PlannerProvider,
    private readonly fallback: PlannerProvider,
  ) {}

  async generate(input: PlannerInput): Promise<PlannerIntent> {
    try {
      return await this.primary.generate(input);
    } catch {
      this.logger.warn("Primary planner failed; trying the configured fallback provider");
      return this.fallback.generate(input);
    }
  }
}
