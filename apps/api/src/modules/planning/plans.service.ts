import { Injectable } from "@nestjs/common";
import { Prisma } from "@flowcapture/database";
import type { AutomationPlanDto } from "@flowcapture/workflow-schema";
import { AppException } from "../../common/app.exception";
import type { AuthenticatedContext } from "../auth/auth.context";
import { PrismaService } from "../database/prisma.service";
import { ApprovePlanDto, ChangeRequestDto } from "./conversations.dto";
import { toPlanDto } from "./planning.mapper";

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async get(auth: AuthenticatedContext, planId: string): Promise<AutomationPlanDto> {
    const plan = await this.prisma.automationPlan.findFirst({
      where: { id: planId, workspaceId: auth.workspaceId },
      include: { approvals: { take: 1 } },
    });
    if (!plan) throw new AppException("NOT_FOUND", "Plan not found.", 404);
    return toPlanDto(plan);
  }

  async approve(auth: AuthenticatedContext, planId: string, input: ApprovePlanDto): Promise<AutomationPlanDto> {
    const plan = await this.prisma.automationPlan.findFirst({
      where: { id: planId, workspaceId: auth.workspaceId },
      include: { approvals: { take: 1 } },
    });
    if (!plan) throw new AppException("NOT_FOUND", "Plan not found.", 404);
    if (plan.version !== input.version || plan.contentHash !== input.contentHash) {
      throw new AppException("PLAN_VERSION_CONFLICT", "This plan has changed. Review the latest version before approving.", 409);
    }
    if (plan.approvals[0]) return toPlanDto(plan);
    if (!input.confirmScopes) {
      throw new AppException("SCOPE_REVIEW_REQUIRED", "Review the services, scopes, and side effects before approving.", 400);
    }
    const definition = toPlanDto(plan).definition;
    if (definition.questions.length > 0) {
      throw new AppException("CLARIFICATION_REQUIRED", "Answer the required clarification questions before approving.", 409);
    }
    if (definition.feasibility !== "supported" || definition.unsupportedSteps.length > 0) {
      throw new AppException("PLAN_NOT_SUPPORTED", "Unsupported or partially supported plans cannot be approved.", 409);
    }
    if (plan.status === "CHANGES_REQUESTED") {
      throw new AppException("PLAN_REVISION_REQUIRED", "Request a revised plan before approving this version.", 409);
    }

    try {
      const approved = await this.prisma.$transaction(async (transaction) => {
        await transaction.planApproval.create({
          data: {
            planId: plan.id,
            workspaceId: auth.workspaceId,
            approvedByUserId: auth.userId,
            planHash: plan.contentHash,
          },
        });
        const updated = await transaction.automationPlan.update({
          where: { id: plan.id },
          data: { status: "APPROVED" },
          include: { approvals: { take: 1 } },
        });
        await transaction.auditLog.create({
          data: {
            workspaceId: auth.workspaceId,
            actorUserId: auth.userId,
            action: "plan.approved",
            targetType: "automation_plan",
            targetId: plan.id,
            metadata: { version: plan.version, contentHash: plan.contentHash, runtimeReady: definition.runtimeReady },
          },
        });
        return updated;
      });
      return toPlanDto(approved);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return this.get(auth, planId);
      }
      throw error;
    }
  }

  async requestChanges(auth: AuthenticatedContext, planId: string, input: ChangeRequestDto): Promise<AutomationPlanDto> {
    const plan = await this.prisma.automationPlan.findFirst({ where: { id: planId, workspaceId: auth.workspaceId } });
    if (!plan) throw new AppException("NOT_FOUND", "Plan not found.", 404);
    const updated = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.automationPlan.update({
        where: { id: plan.id },
        data: { status: "CHANGES_REQUESTED" },
        include: { approvals: { take: 1 } },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: auth.workspaceId,
          actorUserId: auth.userId,
          action: "plan.changes_requested",
          targetType: "automation_plan",
          targetId: plan.id,
          metadata: { version: plan.version, commentLength: input.comment?.length ?? 0 },
        },
      });
      return result;
    });
    return toPlanDto(updated);
  }
}
