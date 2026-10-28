import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import type { ApiData } from "@flowcapture/shared-types";
import type { AutomationPlanDto } from "@flowcapture/workflow-schema";
import { CurrentAuth } from "../../common/decorators/current-auth.decorator";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthenticatedContext } from "../auth/auth.context";
import { SESSION_COOKIE_NAME } from "../auth/session-token";
import { ApprovePlanDto, ChangeRequestDto } from "./conversations.dto";
import { PlansService } from "./plans.service";

@ApiTags("Plans")
@ApiCookieAuth(SESSION_COOKIE_NAME)
@Controller("plans")
@UseGuards(AuthGuard)
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get(":id")
  async get(@CurrentAuth() auth: AuthenticatedContext, @Param("id", ParseUUIDPipe) id: string): Promise<ApiData<AutomationPlanDto>> {
    return { data: await this.plans.get(auth, id) };
  }

  @Post(":id/approve")
  async approve(
    @CurrentAuth() auth: AuthenticatedContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: ApprovePlanDto,
  ): Promise<ApiData<AutomationPlanDto>> {
    return { data: await this.plans.approve(auth, id, input) };
  }

  @Post(":id/change-requests")
  async changes(
    @CurrentAuth() auth: AuthenticatedContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: ChangeRequestDto,
  ): Promise<ApiData<AutomationPlanDto>> {
    return { data: await this.plans.requestChanges(auth, id, input) };
  }
}
