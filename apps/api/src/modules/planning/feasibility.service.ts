import { Injectable } from "@nestjs/common";
import {
  getNodeDefinition,
  getPlanningNodes,
  type NodeDefinition,
} from "@flowcapture/node-definitions";
import {
  automationPlanDefinitionSchema,
  collectStepReferences,
  type AutomationPlanDefinition,
  type ClarificationQuestion,
  type PlannerIntent,
} from "@flowcapture/workflow-schema";

@Injectable()
export class FeasibilityService {
  buildPlan(intent: PlannerIntent, planner: "deterministic" | "llm"): AutomationPlanDefinition {
    const questions: ClarificationQuestion[] = [];
    const unsupported = [...intent.unsupportedSteps];
    const services: AutomationPlanDefinition["services"] = [];
    const sideEffects: AutomationPlanDefinition["sideEffects"] = [];
    let validActions = 0;
    const seen = new Set<string>();

    if (intent.timingUnknowns.includes("time")) {
      questions.push({
        id: "trigger:time",
        stepId: "trigger",
        field: "time",
        kind: "text",
        question: "What local time should this schedule run?",
        required: true,
      });
    }

    for (const action of intent.actions) {
      if (seen.has(action.id)) {
        unsupported.push(`Duplicate step identifier: ${action.id}.`);
        continue;
      }
      if (collectStepReferences(action.config).some((reference) => !seen.has(reference.stepId))) {
        unsupported.push(`Step ${action.id} references a missing or later step.`);
        continue;
      }
      seen.add(action.id);
      const node = getPlanningNodes().find((item) => item.type === action.type && item.version === action.version);
      if (!node || node.category === "trigger") {
        unsupported.push(`Unsupported operation: ${action.type}@${action.version}.`);
        continue;
      }
      const missing = this.missingFields(action.config, node);
      for (const field of missing) {
        questions.push({
          id: `${action.id}:${field.path}`,
          stepId: action.id,
          field: field.path,
          kind: field.kind,
          question: field.question,
          required: true,
        });
      }
      const configResult = node.configSchema.safeParse(action.config);
      const meaningfulErrors = configResult.success ? [] : configResult.error.issues.filter((issue) => {
        return !missing.some((field) => field.path === issue.path.join("."));
      });
      if (meaningfulErrors.length > 0) {
        unsupported.push(`Invalid configuration for ${node.label}.`);
      } else {
        validActions += 1;
      }
      if (node.credentialType) {
        services.push({
          provider: node.credentialType === "google" ? "Google" : "HTTP API",
          credentialType: node.credentialType,
          scopes: node.requiredScopes ?? [],
          reason: node.description,
        });
      }
      if (node.sideEffect) {
        sideEffects.push({ stepId: action.id, description: node.description, risk: node.risk });
      }
    }

    if (intent.actions.length === 0 && unsupported.length === 0) {
      unsupported.push("No supported action was identified.");
    }
    const feasibility = unsupported.length > 0
      ? validActions > 0 ? "partially_supported" : "unsupported"
      : "supported";
    const triggerNode = getNodeDefinition(intent.trigger.type, intent.trigger.version);
    const runtimeReady = feasibility === "supported" && questions.length === 0 && unsupported.length === 0
      && validActions === intent.actions.length
      && intent.actions.every((action) => getNodeDefinition(action.type, action.version)?.maturity === "executable")
      && triggerNode?.maturity === "executable";

    return automationPlanDefinitionSchema.parse({
      schemaVersion: 1,
      name: intent.name,
      purpose: intent.purpose,
      trigger: intent.trigger,
      steps: intent.actions,
      feasibility,
      unsupportedSteps: unsupported,
      questions,
      services: deduplicateServices(services),
      sideEffects,
      assumptions: intent.assumptions,
      dataRead: intent.dataRead,
      dataWritten: intent.dataWritten,
      failureHandling: { onError: "stop", retrySafeSteps: true },
      runtimeReady,
      planner,
    });
  }

  private missingFields(
    config: Record<string, unknown>,
    node: NodeDefinition,
  ): NonNullable<NodeDefinition["requiredFields"]> {
    return (node.requiredFields ?? []).filter((field) => {
      const value = config[field.path];
      return value === undefined || value === null || value === "";
    });
  }
}

function deduplicateServices(
  services: AutomationPlanDefinition["services"],
): AutomationPlanDefinition["services"] {
  const seen = new Set<string>();
  return services.filter((service) => {
    const key = `${service.provider}:${service.scopes.join(",")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
