import { getNodeDefinition } from "@flowcapture/node-definitions";
import {
  plannerIntentSchema,
  type AutomationPlanDefinition,
  type PlannerIntent,
  type WorkflowStep,
} from "@flowcapture/workflow-schema";
import type { PlannerInput, PlannerProvider } from "./planner.provider";

export class DeterministicPlanner implements PlannerProvider {
  readonly kind = "deterministic" as const;

  async generate(input: PlannerInput): Promise<PlannerIntent> {
    const message = input.message.trim();
    const recipient = extractEmail(message);
    if (input.currentPlan?.questions.length) {
      return plannerIntentSchema.parse(answerQuestion(input.currentPlan, message));
    }
    if (input.currentPlan && recipient && /recipient|email|to\b|بريد/i.test(message)) {
      const revised = fromPlan(input.currentPlan);
      revised.actions = revised.actions.map((action) => action.type === "gmail.send"
        ? { ...action, config: { ...action.config, to: recipient } }
        : action);
      return plannerIntentSchema.parse(revised);
    }

    const parsed = parseRequest(message, input.timezone);
    if (input.currentPlan) {
      const current = fromPlan(input.currentPlan);
      if (parsed.actions.length === 0 && parsed.scheduleDetected) {
        current.trigger = parsed.trigger;
        current.timingUnknowns = parsed.timingUnknowns;
        current.assumptions = [...current.assumptions, ...parsed.assumptions];
        return plannerIntentSchema.parse(current);
      }
      if (parsed.actions.length === 0 && parsed.unsupportedSteps.length > 0) {
        current.unsupportedSteps = [...current.unsupportedSteps, ...parsed.unsupportedSteps].slice(0, 20);
        return plannerIntentSchema.parse(current);
      }
    }
    return plannerIntentSchema.parse(parsed.intent);
  }
}

interface ParsedRequest {
  intent: PlannerIntent;
  trigger: PlannerIntent["trigger"];
  timingUnknowns: Array<"time">;
  assumptions: string[];
  actions: WorkflowStep[];
  unsupportedSteps: string[];
  scheduleDetected: boolean;
}

function parseRequest(message: string, timezone: string): ParsedRequest {
  const lower = message.toLowerCase();
  const schedule = parseSchedule(message, timezone);
  const name = deriveName(message);
  const purpose = message.slice(0, 1000) || "Describe an automation";
  const url = extractUrl(message);
  const email = extractEmail(message);
  const actions: WorkflowStep[] = [];
  const unsupportedSteps: string[] = [];

  if (/browser|mobile app|instagram|whatsapp|تطبيق الجوال|متصفح/i.test(lower)) {
    unsupportedSteps.push("Arbitrary browser, social-media, or mobile-app control is not supported in the MVP.");
  }
  if (url || /\b(https?|api|endpoint)\b/i.test(lower) || /واجهة برمجية|رابط/i.test(message)) {
    actions.push(action("fetch", "http.get", url ? { url } : {}));
  }
  if (/summar|digest|ملخص|لخص|تلخيص/i.test(lower)) {
    actions.push(action("summary", "ai.summarize", { maxWords: 200 }));
  }
  if (/sheet|spreadsheet|جوجل شيت|جداول/i.test(lower)) {
    const append = /append|add row|write|إضافة|اضافة|اكتب/i.test(lower);
    actions.push(action("sheet", append ? "sheets.append" : "sheets.read", {}));
  }
  if (/gmail|e-?mail|بريد إلكتروني|ايميل/i.test(lower)) {
    actions.push(action("send", "gmail.send", {
      ...(email ? { to: email } : {}),
      subject: name,
      body: purpose,
    }));
  }
  if (/map fields|extract fields|تعيين الحقول/i.test(lower)) {
    actions.push(action("map", "map.fields", { fields: {} }));
  }
  if (actions.length === 0 && unsupportedSteps.length === 0) {
    unsupportedSteps.push("No supported action was recognized. Try an HTTP API, Sheets, summarization, or Gmail request.");
  }

  linkSteps(actions, purpose);
  const dataRead = actions.filter((item) => ["http.get", "sheets.read"].includes(item.type)).map((item) => `Data read by ${item.label}`);
  const dataWritten = actions.filter((item) => ["gmail.send", "sheets.append"].includes(item.type)).map((item) => `Data written by ${item.label}`);
  const intent: PlannerIntent = {
    schemaVersion: 1,
    name,
    purpose,
    trigger: schedule.trigger,
    actions,
    unsupportedSteps,
    assumptions: schedule.assumptions,
    dataRead,
    dataWritten,
    timingUnknowns: schedule.timingUnknowns,
  };
  return { intent, ...schedule, actions, unsupportedSteps };
}

function parseSchedule(message: string, timezone: string): {
  trigger: PlannerIntent["trigger"];
  timingUnknowns: Array<"time">;
  assumptions: string[];
  scheduleDetected: boolean;
} {
  const lower = message.toLowerCase();
  const weekly = /weekly|every week|كل أسبوع|اسبوعيا/i.test(lower);
  const weekdays = /weekday|every weekday|أيام الأسبوع|ايام الاسبوع/i.test(lower);
  const daily = /daily|every day|each morning|كل يوم|يوميا/i.test(lower);
  const hourly = /hourly|every hour|كل ساعة/i.test(lower);
  const scheduleDetected = weekly || weekdays || daily || hourly;
  if (!scheduleDetected) {
    return { trigger: { type: "manual.trigger", version: 1, config: {} }, timingUnknowns: [], assumptions: [], scheduleDetected: false };
  }
  if (hourly) {
    return {
      trigger: { type: "schedule.trigger", version: 1, config: { frequency: "hourly", timezone } },
      timingUnknowns: [], assumptions: [], scheduleDetected: true,
    };
  }
  const parsedTime = parseTime(message);
  const assumptions = parsedTime ? [] : ["A provisional 09:00 local time is shown until you confirm the schedule."];
  return {
    trigger: {
      type: "schedule.trigger",
      version: 1,
      config: {
        frequency: weekly || weekdays ? "weekly" : "daily",
        time: parsedTime ?? "09:00",
        timezone,
        ...(weekly || weekdays ? { weekdays: weekdays ? [1, 2, 3, 4, 5] : [1] } : {}),
      },
    },
    timingUnknowns: parsedTime ? [] : ["time"],
    assumptions,
    scheduleDetected: true,
  };
}

function answerQuestion(plan: AutomationPlanDefinition, answer: string): PlannerIntent {
  const intent = fromPlan(plan);
  const question = plan.questions[0];
  if (!question) return intent;
  if (question.stepId === "trigger" && question.field === "time") {
    const time = parseTime(answer);
    if (time && intent.trigger.type === "schedule.trigger") {
      intent.trigger = { ...intent.trigger, config: { ...intent.trigger.config, time } };
      intent.timingUnknowns = [];
    }
    return intent;
  }
  const action = intent.actions.find((item) => item.id === question.stepId);
  if (!action) return intent;
  const value = question.kind === "url" ? extractUrl(answer) : question.kind === "email" ? extractEmail(answer) : answer.trim();
  if (value) action.config = { ...action.config, [question.field]: value };
  return intent;
}

function fromPlan(plan: AutomationPlanDefinition): PlannerIntent {
  return {
    schemaVersion: 1,
    name: plan.name,
    purpose: plan.purpose,
    trigger: structuredClone(plan.trigger),
    actions: structuredClone(plan.steps),
    unsupportedSteps: [...plan.unsupportedSteps],
    assumptions: [...plan.assumptions],
    dataRead: [...plan.dataRead],
    dataWritten: [...plan.dataWritten],
    timingUnknowns: plan.questions.some((question) => question.id === "trigger:time") ? ["time"] : [],
  };
}

function action(id: string, type: string, config: Record<string, unknown>): WorkflowStep {
  return { id, type, version: 1, label: getNodeDefinition(type)?.label ?? type, config };
}

function linkSteps(actions: WorkflowStep[], purpose: string): void {
  for (const [index, step] of actions.entries()) {
    const previous = actions[index - 1];
    const reference = previous ? `{{steps.${previous.id}.${previous.type === "ai.summarize" ? "text" : previous.type === "sheets.read" ? "values" : "body"}}}` : undefined;
    if (step.type === "ai.summarize" && reference) step.config.input = reference;
    if (step.type === "gmail.send" && reference) step.config.body = reference;
    if (step.type === "sheets.append") step.config.values = reference ? [reference] : [purpose];
    if (step.type === "map.fields") step.config.fields = reference ? { value: reference } : { value: purpose };
  }
}

function parseTime(message: string): string | undefined {
  const withoutNetworkIdentifiers = message.replace(/https?:\/\/\S+/gi, " ").replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, " ");
  const match = withoutNetworkIdentifiers.match(/\b([01]?\d|2[0-3])(?::([0-5]\d))?\s*(am|pm)?\b/i)
    ?? withoutNetworkIdentifiers.match(/الساعة\s+(\d{1,2})(?::([0-5]\d))?/i);
  if (!match?.[1]) return undefined;
  let hour = Number(match[1]);
  const minute = match[2] ?? "00";
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hour < 12) hour += 12;
  if (meridiem === "am" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function extractUrl(message: string): string | undefined {
  return message.match(/https?:\/\/[^\s<>"']+/i)?.[0].replace(/[).,;]+$/, "");
}

function extractEmail(message: string): string | undefined {
  return message.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+/)?.[0];
}

function deriveName(message: string): string {
  return message.replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "New automation";
}
