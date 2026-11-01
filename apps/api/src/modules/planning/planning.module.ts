import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEnvironment, RemotePlannerMode } from "../../config/environment";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { DeterministicPlanner } from "./deterministic.planner";
import { FallbackPlanner } from "./fallback.planner";
import { FeasibilityService } from "./feasibility.service";
import { OpenAiPlanner } from "./openai.planner";
import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import {
  PLANNER_PROVIDER,
  PlannerUnavailableError,
  type PlannerProvider,
} from "./planner.provider";

@Module({
  controllers: [ConversationsController, PlansController],
  providers: [
    ConversationsService,
    PlansService,
    FeasibilityService,
    {
      provide: PLANNER_PROVIDER,
      inject: [ConfigService],
      useFactory(config: ConfigService<AppEnvironment, true>): PlannerProvider {
        const mode = config.get("PLANNER_MODE");
        if (mode === "deterministic") return new DeterministicPlanner();
        if (mode === "disabled") return unavailablePlanner();
        const primary = new OpenAiPlanner(config, mode);
        const fallbackMode = config.get("PLANNER_FALLBACK_MODE");
        return fallbackMode === "disabled"
          ? primary
          : new FallbackPlanner(primary, new OpenAiPlanner(config, fallbackMode as RemotePlannerMode));
      },
    },
  ],
})
export class PlanningModule {}

function unavailablePlanner(): PlannerProvider {
  return {
    kind: "deterministic",
    generate: () => Promise.reject(new PlannerUnavailableError()),
  };
}
