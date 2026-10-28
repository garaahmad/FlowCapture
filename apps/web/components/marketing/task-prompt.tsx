"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const examples = [
  "Every weekday at 8 AM, get news from my API and prepare a summary.",
  "Each morning, read a Google Sheet and organize the new rows.",
];

export function TaskPrompt() {
  const [task, setTask] = useState("");
  const router = useRouter();

  function start(event?: React.FormEvent) {
    event?.preventDefault();
    try {
      sessionStorage.setItem("flowcapture.draftTask", task.trim());
      sessionStorage.setItem("flowcapture.postOnboarding", "/app/chat");
    } catch {
      // Storage can be unavailable in strict privacy modes; registration still works.
    }
    router.push("/register");
  }

  return (
    <div>
      <form onSubmit={start} className="rounded-2xl border border-border bg-surface p-2 shadow-[0_16px_50px_rgba(23,55,38,0.08)]">
        <label htmlFor="task-description" className="sr-only">Describe your automation</label>
        <Textarea
          id="task-description"
          value={task}
          onChange={(event) => setTask(event.target.value)}
          placeholder="Describe what you want to automate…"
          className="min-h-24 resize-none border-0 bg-transparent text-base shadow-none focus:ring-0"
          maxLength={4000}
        />
        <div className="flex items-center justify-between gap-3 border-t border-border/70 px-2 pt-2">
          <span className="hidden text-xs text-muted sm:block">English or Arabic · No workflow editor needed</span>
          <Button type="submit" className="ms-auto">
            Build my plan <ArrowUpRight className="size-4" />
          </Button>
        </div>
      </form>
      <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted">
        <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
        <p>Your draft stays in this browser while you create an account.</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example, index) => (
          <button key={example} type="button" onClick={() => setTask(example)} className="rounded-full border border-border bg-surface px-3 py-1.5 text-start text-xs text-muted transition hover:border-brand/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            Example {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
