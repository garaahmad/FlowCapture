import { Inject, Injectable, Logger } from "@nestjs/common";
import { Prisma, type Message } from "@flowcapture/database";
import {
  plannerIntentSchema,
  type AutomationPlanDefinition,
  type ConversationDetailDto,
  type ConversationSummaryDto,
  type SendMessageResponseDto,
} from "@flowcapture/workflow-schema";
import { AppException } from "../../common/app.exception";
import type { AuthenticatedContext } from "../auth/auth.context";
import { PrismaService } from "../database/prisma.service";
import { CreateConversationDto, SendMessageDto } from "./conversations.dto";
import { FeasibilityService } from "./feasibility.service";
import { hashPlanDefinition } from "./plan-hash";
import { PLANNER_PROVIDER, PlannerUnavailableError, type PlannerProvider } from "./planner.provider";
import { redactPotentialSecrets } from "./redaction";
import { toConversationSummary, toMessageDto, toPlanDto } from "./planning.mapper";

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feasibility: FeasibilityService,
    @Inject(PLANNER_PROVIDER) private readonly planner: PlannerProvider,
  ) {}

  async create(auth: AuthenticatedContext, input: CreateConversationDto): Promise<ConversationSummaryDto> {
    const conversation = await this.prisma.$transaction(async (transaction) => {
      const created = await transaction.conversation.create({
        data: {
          workspaceId: auth.workspaceId,
          userId: auth.userId,
          title: input.title ?? "New automation",
        },
      });
      await transaction.auditLog.create({
        data: {
          workspaceId: auth.workspaceId,
          actorUserId: auth.userId,
          action: "conversation.created",
          targetType: "conversation",
          targetId: created.id,
        },
      });
      return created;
    });
    return toConversationSummary(conversation);
  }

  async list(auth: AuthenticatedContext): Promise<ConversationSummaryDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { workspaceId: auth.workspaceId, status: { not: "ARCHIVED" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
    return conversations.map(toConversationSummary);
  }

  async get(auth: AuthenticatedContext, id: string): Promise<ConversationDetailDto> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, workspaceId: auth.workspaceId },
      include: {
        messages: { orderBy: { createdAt: "asc" }, take: 200 },
        plans: { orderBy: { version: "desc" }, take: 50, include: { approvals: { take: 1 } } },
      },
    });
    if (!conversation) throw new AppException("NOT_FOUND", "Conversation not found.", 404);
    return {
      ...toConversationSummary(conversation),
      messages: conversation.messages.map(toMessageDto),
      plans: conversation.plans.map(toPlanDto),
    };
  }

  async sendMessage(
    auth: AuthenticatedContext,
    conversationId: string,
    input: SendMessageDto,
  ): Promise<SendMessageResponseDto> {
    const duplicate = await this.findDuplicate(auth, conversationId, input.clientMessageId);
    if (duplicate) return duplicate;

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, workspaceId: auth.workspaceId },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 8 },
        plans: { orderBy: { version: "desc" }, take: 1, include: { approvals: { take: 1 } } },
      },
    });
    if (!conversation) throw new AppException("NOT_FOUND", "Conversation not found.", 404);
    const redaction = redactPotentialSecrets(input.content);
    let userMessage: Message;
    try {
      userMessage = await this.prisma.message.create({
        data: {
          conversationId,
          workspaceId: auth.workspaceId,
          role: "USER",
          kind: "TEXT",
          content: redaction.content,
          clientMessageId: input.clientMessageId,
          payload: { redactedSecrets: redaction.redacted },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const response = await this.findDuplicate(auth, conversationId, input.clientMessageId);
        if (response) return response;
      }
      throw error;
    }

    const latestPlan = conversation.plans[0];
    try {
      const intent = plannerIntentSchema.parse(await this.planner.generate({
        message: redaction.content,
        timezone: auth.user.timezone,
        currentPlan: latestPlan ? toPlanDto(latestPlan).definition : undefined,
        history: conversation.messages.reverse().map((message) => ({
          role: message.role === "USER" ? "user" as const : "assistant" as const,
          content: message.content.slice(0, 1000),
        })),
      }));
      const definition = this.feasibility.buildPlan(intent, this.planner.kind);
      const contentHash = hashPlanDefinition(definition);
      const reusablePlan = isReusablePlan(latestPlan, contentHash) ? latestPlan : undefined;
      const plan = reusablePlan ?? await this.prisma.automationPlan.create({
        data: {
          conversationId,
          workspaceId: auth.workspaceId,
          version: (latestPlan?.version ?? 0) + 1,
          status: definition.questions.length ? "NEEDS_CLARIFICATION" : "DRAFT",
          definition: definition as unknown as Prisma.InputJsonValue,
          contentHash,
          feasibility: definition.feasibility.toUpperCase() as "SUPPORTED" | "PARTIALLY_SUPPORTED" | "UNSUPPORTED",
        },
      });
      const assistant = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.message.create({
          data: {
            conversationId,
            workspaceId: auth.workspaceId,
            role: "ASSISTANT",
            kind: definition.questions.length ? "CLARIFICATION" : "PLAN",
            content: assistantContent(definition, plan.version, redaction.redacted),
            planId: plan.id,
            payload: {
              planner: definition.planner,
              runtimeReady: definition.runtimeReady,
              feasibility: definition.feasibility,
              redactedSecrets: redaction.redacted,
            },
          },
        });
        await transaction.conversation.update({
          where: { id: conversationId },
          data: { title: definition.name, status: "ACTIVE", draftState: { latestPlanId: plan.id } },
        });
        return created;
      });
      return {
        message: toMessageDto(userMessage),
        assistant: toMessageDto(assistant),
        plan: toPlanDto(plan),
        redactedSecrets: redaction.redacted,
      };
    } catch (error) {
      const unavailable = error instanceof PlannerUnavailableError;
      if (!unavailable) this.logger.error("Planning failed; an error message was persisted");
      const assistant = await this.prisma.message.create({
        data: {
          conversationId,
          workspaceId: auth.workspaceId,
          role: "ASSISTANT",
          kind: "ERROR",
          content: unavailable
            ? "The planner is not configured in this environment. Your message was saved, but no plan was created."
            : "The planner could not complete this request. Your message was saved, but no plan was created or approved.",
          payload: { errorCode: unavailable ? "PLANNER_NOT_CONFIGURED" : "PLANNING_FAILED" },
        },
      });
      return { message: toMessageDto(userMessage), assistant: toMessageDto(assistant), redactedSecrets: redaction.redacted };
    }
  }

  private async findDuplicate(
    auth: AuthenticatedContext,
    conversationId: string,
    clientMessageId: string,
  ): Promise<SendMessageResponseDto | undefined> {
    const message = await this.prisma.message.findFirst({
      where: { conversationId, workspaceId: auth.workspaceId, clientMessageId, role: "USER" },
    });
    if (!message) return undefined;
    const assistant = await this.prisma.message.findFirst({
      where: { conversationId, workspaceId: auth.workspaceId, role: "ASSISTANT", createdAt: { gte: message.createdAt } },
      orderBy: { createdAt: "asc" },
    });
    if (!assistant) throw new AppException("MESSAGE_IN_PROGRESS", "This message is still being processed.", 409);
    const plan = assistant.planId ? await this.prisma.automationPlan.findFirst({
      where: { id: assistant.planId, workspaceId: auth.workspaceId },
      include: { approvals: { take: 1 } },
    }) : undefined;
    return {
      message: toMessageDto(message),
      assistant: toMessageDto(assistant),
      plan: plan ? toPlanDto(plan) : undefined,
      redactedSecrets: false,
    };
  }
}

export function isReusablePlan(
  plan: { contentHash: string; status: string } | undefined,
  contentHash: string,
): boolean {
  return Boolean(plan && plan.contentHash === contentHash && plan.status !== "CHANGES_REQUESTED");
}

function assistantContent(definition: AutomationPlanDefinition, version: number, redacted: boolean): string {
  const redactionNote = redacted ? " Potential secret values were redacted before planning." : "";
  const firstQuestion = definition.questions[0];
  if (firstQuestion) return `I need one more detail: ${firstQuestion.question}${redactionNote}`;
  if (definition.feasibility === "unsupported") return `I could not create a supported plan. Review the unsupported portions.${redactionNote}`;
  if (definition.feasibility === "partially_supported") return `I prepared a partial plan with limitations to review.${redactionNote}`;
  return `I prepared plan version ${version}. Review its steps, services, and side effects before deciding whether to approve.${redactionNote}`;
}
