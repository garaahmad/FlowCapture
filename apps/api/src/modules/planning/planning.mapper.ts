import type {
  AutomationPlan,
  Conversation,
  Message,
  PlanApproval,
} from "@flowcapture/database";
import {
  automationPlanDefinitionSchema,
  type AutomationPlanDto,
  type ConversationMessageDto,
  type ConversationSummaryDto,
} from "@flowcapture/workflow-schema";

export type PlanRecord = AutomationPlan & { approvals?: PlanApproval[] };

export function toPlanDto(plan: PlanRecord): AutomationPlanDto {
  return {
    id: plan.id,
    conversationId: plan.conversationId,
    version: plan.version,
    status: plan.status.toLowerCase() as AutomationPlanDto["status"],
    definition: automationPlanDefinitionSchema.parse(plan.definition),
    contentHash: plan.contentHash,
    feasibility: plan.feasibility.toLowerCase() as AutomationPlanDto["feasibility"],
    createdAt: plan.createdAt.toISOString(),
    approvedAt: plan.approvals?.[0]?.approvedAt.toISOString(),
  };
}

export function toMessageDto(message: Message): ConversationMessageDto {
  return {
    id: message.id,
    role: message.role.toLowerCase() as ConversationMessageDto["role"],
    kind: message.kind.toLowerCase() as ConversationMessageDto["kind"],
    content: message.content,
    planId: message.planId ?? undefined,
    payload: isRecord(message.payload) ? message.payload : null,
    createdAt: message.createdAt.toISOString(),
  };
}

export function toConversationSummary(conversation: Conversation): ConversationSummaryDto {
  return {
    id: conversation.id,
    title: conversation.title,
    status: conversation.status.toLowerCase() as ConversationSummaryDto["status"],
    updatedAt: conversation.updatedAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
