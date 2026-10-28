import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppEnvironment } from "../../config/environment";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { DeterministicPlanner } from "./deterministic.planner";
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
        if (mode === "openai") return new OpenAiPlanner(config);
        return {
          kind: "deterministic",
          generate: () => Promise.reject(new PlannerUnavailableError()),
        };
      },
    },
  ],
})
export class PlanningModule {}
