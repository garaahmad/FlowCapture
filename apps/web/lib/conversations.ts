import type {
  ConversationDetailDto,
  ConversationSummaryDto,
  SendMessageResponseDto,
  AutomationPlanDto,
} from "@flowcapture/workflow-schema";
import { apiData, jsonBody } from "@/lib/api";

export function listConversations() {
  return apiData<ConversationSummaryDto[]>("/conversations");
}

export function createConversation(title?: string) {
  return apiData<ConversationSummaryDto>("/conversations", { method: "POST", body: jsonBody({ title }) });
}

export function getConversation(id: string) {
  return apiData<ConversationDetailDto>(`/conversations/${id}`);
}

export function sendConversationMessage(id: string, content: string, clientMessageId: string) {
  return apiData<SendMessageResponseDto>(`/conversations/${id}/messages`, {
    method: "POST",
    body: jsonBody({ content, clientMessageId }),
  });
}

export function approvePlan(plan: AutomationPlanDto) {
  return apiData<AutomationPlanDto>(`/plans/${plan.id}/approve`, {
    method: "POST",
    body: jsonBody({ version: plan.version, contentHash: plan.contentHash, confirmScopes: true }),
  });
}

export function requestPlanChanges(plan: AutomationPlanDto, comment: string) {
  return apiData<AutomationPlanDto>(`/plans/${plan.id}/change-requests`, {
    method: "POST",
    body: jsonBody({ comment }),
  });
}
