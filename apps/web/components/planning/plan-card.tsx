"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, CircleAlert, Clock3, LockKeyhole, Pencil, ShieldCheck } from "lucide-react";
import type { AutomationPlanDto } from "@flowcapture/workflow-schema";
import { approvePlan, requestPlanChanges } from "@/lib/conversations";
import { ApiError } from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export function PlanCard({ plan, onRequestChanges }: { plan: AutomationPlanDto; onRequestChanges: (text: string) => void }) {
  const queryClient = useQueryClient();
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState<string>();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["conversation", plan.conversationId] });
  const approval = useMutation({
    mutationFn: () => approvePlan(plan),
    onSuccess: invalidate,
    onError: (cause) => setError(cause instanceof ApiError ? cause.message : "Approval failed."),
  });
  const changes = useMutation({
    mutationFn: () => requestPlanChanges(plan, "Revision requested from the plan review card."),
    onSuccess: () => {
      void invalidate();
      onRequestChanges(`Please revise plan version ${plan.version}: `);
    },
    onError: (cause) => setError(cause instanceof ApiError ? cause.message : "Could not request changes."),
  });
  const approvable = plan.status !== "approved" && plan.status !== "changes_requested"
    && plan.feasibility === "supported" && plan.definition.questions.length === 0;
  const question = plan.definition.questions[0];

  return (
    <Card className="my-3 overflow-hidden border-brand/25">
      <div className="border-b border-border bg-surface-raised/40 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{plan.definition.name}</h3><Badge>PLAN v{plan.version}</Badge></div><p className="mt-1.5 text-sm leading-6 text-muted">{plan.definition.purpose}</p></div>
          <Badge className={plan.status === "approved" ? "border-brand/30 bg-brand-soft text-brand" : ""}>{plan.status.replaceAll("_", " ").toUpperCase()}</Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted">
          <Badge>{plan.definition.planner === "deterministic" ? "RULES-BASED PLANNER" : "LLM PLANNER"}</Badge>
          <Badge>{plan.definition.feasibility.replaceAll("_", " ").toUpperCase()}</Badge>
          <Badge><Clock3 className="size-3" />{triggerLabel(plan)}</Badge>
        </div>
      </div>
      <div className="space-y-5 p-5">
        {question ? <Alert title="Clarification needed">{question.question}</Alert> : null}
        {plan.definition.unsupportedSteps.length ? <Alert tone="error" title="Unsupported portions"><ul className="list-disc ps-5">{plan.definition.unsupportedSteps.map((item) => <li key={item}>{item}</li>)}</ul></Alert> : null}
        <section>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted">Ordered steps</h4>
          <ol className="mt-3 space-y-3">
            {plan.definition.steps.map((step, index) => (
              <li key={step.id} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{step.label}</p><p className="mt-0.5 font-mono text-[11px] text-muted">{step.type}@{step.version}</p>
                  <details className="mt-1.5 text-xs text-muted"><summary className="inline-flex cursor-pointer items-center gap-1 rounded hover:text-foreground">Inspect configuration <ChevronDown className="size-3" /></summary><pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-surface-raised p-3 text-[11px] leading-5 whitespace-pre-wrap break-all">{JSON.stringify(step.config, null, 2)}</pre></details>
                </div>
              </li>
            ))}
          </ol>
        </section>
        {plan.definition.services.length ? <section><h4 className="text-xs font-bold uppercase tracking-wider text-muted">Connections & permissions</h4><div className="mt-2 space-y-2">{plan.definition.services.map((service) => <div key={`${service.provider}-${service.scopes.join()}`} className="rounded-xl border border-border p-3 text-xs"><p className="font-semibold">{service.provider} · {service.credentialType}</p><p className="mt-1 text-muted">{service.reason}</p>{service.scopes.map((scope) => <p key={scope} className="mt-1 break-all font-mono text-[10px] text-muted">{scope}</p>)}</div>)}</div></section> : null}
        {plan.definition.sideEffects.length ? <Alert tone="info" title="External side effects"><ul className="list-disc ps-5">{plan.definition.sideEffects.map((effect) => <li key={effect.stepId}>{effect.description} · {effect.risk} risk</li>)}</ul></Alert> : null}
        {plan.definition.assumptions.length ? <section><h4 className="text-xs font-bold uppercase tracking-wider text-muted">Assumptions</h4><ul className="mt-2 list-disc ps-5 text-xs leading-5 text-muted">{plan.definition.assumptions.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
        {!plan.definition.runtimeReady ? <Alert><LockKeyhole className="size-4" />This is a planning artifact only. Workflow compilation and execution are not enabled in this build; approval will not build, test, or activate anything.</Alert> : null}
        {error ? <Alert tone="error">{error}</Alert> : null}
        {plan.status === "approved" ? <Alert tone="success"><CheckCircle2 className="size-4" />This exact plan version and hash were approved. No live execution was authorized.</Alert> : null}
        {approvable ? <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3 text-xs leading-5"><input type="checkbox" className="mt-0.5 size-4 accent-[var(--brand)]" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /><span>I reviewed the ordered steps, data flow, permissions, recipients, and side effects. I understand this is plan approval only.</span></label> : null}
        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          {plan.status !== "approved" && plan.status !== "changes_requested" ? <Button variant="outline" size="sm" onClick={() => changes.mutate()} disabled={changes.isPending}><Pencil className="size-3.5" />Request changes</Button> : null}
          {approvable ? <Button size="sm" onClick={() => { setError(undefined); approval.mutate(); }} disabled={!reviewed || approval.isPending}>{approval.isPending ? <Spinner /> : <ShieldCheck className="size-3.5" />}Approve plan v{plan.version}</Button> : null}
        </div>
        {plan.status === "changes_requested" ? <p className="flex items-center gap-2 text-xs text-muted"><CircleAlert className="size-3.5" />Send your requested changes in the composer to create a new plan version.</p> : null}
      </div>
    </Card>
  );
}

function triggerLabel(plan: AutomationPlanDto): string {
  const trigger = plan.definition.trigger;
  if (trigger.type === "manual.trigger") return "Manual trigger";
  const config = trigger.config;
  return `${config.frequency}${config.time ? ` at ${config.time}` : ""} · ${config.timezone}`;
}
