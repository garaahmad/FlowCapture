"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, MessageSquarePlus, Send, Sparkles, UserRound } from "lucide-react";
import type { ConversationDetailDto, SendMessageResponseDto } from "@flowcapture/workflow-schema";
import {
  createConversation,
  getConversation,
  listConversations,
  sendConversationMessage,
} from "@/lib/conversations";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PlanCard } from "@/components/planning/plan-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const examples = [
  "Every weekday at 8 AM, read https://example.com/news.json and summarize it",
  "Daily at 6 PM, read https://example.com/data.json, summarize it and email person@example.com",
];

export default function ChatPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const composer = useRef<HTMLTextAreaElement>(null);
  const conversations = useQuery({ queryKey: ["conversations"], queryFn: listConversations });
  const activeId = selectedId ?? conversations.data?.[0]?.id;
  const detail = useQuery({
    queryKey: ["conversation", activeId],
    queryFn: () => getConversation(activeId as string),
    enabled: Boolean(activeId),
  });

  useEffect(() => {
    let frame: number | undefined;
    try {
      const draft = sessionStorage.getItem("flowcapture.draftTask");
      if (draft) {
        sessionStorage.removeItem("flowcapture.draftTask");
        frame = requestAnimationFrame(() => setInput(draft));
      }
    } catch { /* Browser storage is optional. */ }
    return () => { if (frame !== undefined) cancelAnimationFrame(frame); };
  }, []);

  async function newConversation() {
    setError(undefined);
    try {
      const conversation = await createConversation();
      setSelectedId(conversation.id);
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      composer.current?.focus();
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not create a conversation."); }
  }

  async function send() {
    const content = input.trim();
    if (!content || busy) return;
    setBusy(true); setError(undefined);
    try {
      const id = activeId ?? (await createConversation()).id;
      setSelectedId(id);
      const response = await sendConversationMessage(id, content, crypto.randomUUID());
      setInput("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["conversation", id] }),
      ]);
      applyResponseHint(response);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Your message could not be sent. Please retry.");
    } finally { setBusy(false); }
  }

  function applyResponseHint(response: SendMessageResponseDto) {
    if (response.redactedSecrets) setError("Potential secrets were redacted. Use the future connections manager for credentials; never paste them into chat.");
  }

  const conversation: ConversationDetailDto | undefined = detail.data;
  const plans = new Map(conversation?.plans.map((plan) => [plan.id, plan]));
  const latestPlan = conversation?.plans[0];
  const question = latestPlan?.definition.questions[0];

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-border bg-surface p-3 lg:min-h-[calc(100vh-10rem)]">
        <Button variant="outline" className="w-full" onClick={newConversation}><MessageSquarePlus className="size-4" />New automation</Button>
        <div className="mt-4 flex items-center justify-between px-2"><h2 className="text-xs font-bold uppercase tracking-wider text-muted">Conversations</h2>{conversations.isFetching ? <Spinner className="size-3" /> : null}</div>
        <div className="mt-2 max-h-48 space-y-1 overflow-y-auto lg:max-h-[calc(100vh-16rem)]">
          {conversations.data?.length === 0 ? <p className="px-2 py-4 text-xs leading-5 text-muted">No saved conversations yet.</p> : null}
          {conversations.data?.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={cn("w-full rounded-xl px-3 py-2.5 text-start transition hover:bg-surface-raised", activeId === item.id && "bg-brand-soft/60")}><span className="block truncate text-sm font-semibold">{item.title}</span><span className="mt-1 block text-[11px] text-muted">{new Date(item.updatedAt).toLocaleDateString()} · {item.status}</span></button>)}
        </div>
        {conversations.isError ? <Alert tone="error" className="mt-3">Could not load conversation history.</Alert> : null}
      </aside>

      <section className="flex min-h-[calc(100vh-10rem)] min-w-0 flex-col rounded-2xl border border-border bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div><h1 className="font-bold">AI automation builder</h1><p className="mt-0.5 text-xs text-muted">Describe → clarify → review → approve</p></div>
          <Badge><Sparkles className="size-3" /> GROUNDED PLANS ONLY</Badge>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
          {detail.isLoading ? <div className="grid h-40 place-items-center"><Spinner className="size-5 text-brand" /></div> : null}
          {detail.isError ? <Alert tone="error" title="Conversation unavailable">{detail.error instanceof Error ? detail.error.message : "Could not load this conversation."}</Alert> : null}
          {!activeId || conversation?.messages.length === 0 ? (
            <div className="mx-auto max-w-xl py-10 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand"><Bot className="size-6" /></span>
              <h2 className="mt-5 text-2xl font-extrabold tracking-tight">What should we automate?</h2>
              <p className="mt-3 text-sm leading-6 text-muted">Start with a supported API, Sheets, summarization, or Gmail task. You will review every plan before approval.</p>
              <div className="mt-6 grid gap-2">{examples.map((example) => <button key={example} onClick={() => { setInput(example); composer.current?.focus(); }} className="rounded-xl border border-border p-3 text-start text-xs leading-5 text-muted transition hover:border-brand/40 hover:text-foreground">{example}</button>)}</div>
            </div>
          ) : null}
          <div className="mx-auto max-w-3xl">
            {conversation?.messages.map((message) => {
              const plan = message.planId ? plans.get(message.planId) : undefined;
              return (
                <div key={message.id} className={cn("mb-5 flex gap-3", message.role === "user" && "justify-end")}>
                  {message.role !== "user" ? <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Bot className="size-4" /></span> : null}
                  <div className={cn("min-w-0", message.role === "user" ? "max-w-[85%]" : "w-full")}>
                    <div className={cn("rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap", message.role === "user" ? "bg-brand text-white dark:text-[#0b2117]" : message.kind === "error" ? "border border-danger/30 bg-danger/5 text-danger" : "bg-surface-raised")}>{message.content}</div>
                    {message.role === "user" ? <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted"><UserRound className="size-3" />You</span> : null}
                    {plan ? <PlanCard key={plan.id} plan={plan} onRequestChanges={(text) => { setInput(text); composer.current?.focus(); }} /> : null}
                  </div>
                </div>
              );
            })}
            {busy ? <div className="flex items-center gap-3 text-sm text-muted"><span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand"><Spinner /></span><span>Saving your message and generating a registry-validated plan…</span></div> : null}
          </div>
        </div>
        <div className="border-t border-border p-4 sm:p-5">
          {error ? <Alert tone={error.startsWith("Potential") ? "info" : "error"} className="mb-3">{error}</Alert> : null}
          <form onSubmit={(event) => { event.preventDefault(); void send(); }} className="mx-auto max-w-3xl">
            {question ? <p className="mb-2 text-xs font-semibold text-brand">Answering: {question.question}</p> : null}
            <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 focus-within:border-brand">
              <Textarea ref={composer} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} placeholder={question?.question ?? "Describe your automation or answer a clarification…"} className="max-h-40 min-h-12 flex-1 resize-none border-0 bg-transparent shadow-none focus:ring-0" maxLength={4000} disabled={busy} aria-label="Automation message" />
              <Button type="submit" size="icon" disabled={!input.trim() || busy} aria-label="Send message">{busy ? <Spinner /> : <Send className="size-4" />}</Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted">Enter to send · Shift+Enter for a new line · Never paste API keys or tokens</p>
          </form>
        </div>
      </section>
    </div>
  );
}
