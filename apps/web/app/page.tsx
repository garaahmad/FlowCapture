import Link from "next/link";
import {
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileJson2,
  Globe2,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Sheet,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { TaskPrompt } from "@/components/marketing/task-prompt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: MessageSquareText,
    title: "A conversation, not a canvas",
    description: "Describe the outcome in English or Arabic. The planning experience is designed to clarify only what is missing.",
  },
  {
    icon: ClipboardCheck,
    title: "Review before anything runs",
    description: "See the ordered steps, data flow, required permissions, and side effects before approving a specific plan version.",
  },
  {
    icon: ShieldCheck,
    title: "Bounded by design",
    description: "Only registered operations can execute. No arbitrary generated code, hidden permission changes, or silent workflow edits.",
  },
];

const faqs = [
  ["Do I need to know workflow tools?", "No. The intended experience starts with plain language and presents a readable plan instead of requiring nodes or code."],
  ["Can it automate any website or mobile app?", "No. FlowCapture is intentionally limited to registered capabilities. Arbitrary browser and mobile control are outside the MVP."],
  ["Does approving a plan activate it?", "No. Plan approval, live testing, and activation are separate consent steps."],
  ["Which integrations are available?", "HTTP, Gmail, and Google Sheets are on the initial integration roadmap. Availability is shown honestly inside the product as each phase is verified."],
];

export default function LandingPage() {
  return (
    <div className="overflow-hidden">
      <SiteHeader />
      <main>
        <section className="relative border-b border-border/60">
          <div className="hero-grid pointer-events-none absolute inset-0" />
          <div className="glow pointer-events-none absolute -top-32 start-1/3 size-[32rem]" />
          <div className="container-shell relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16 lg:py-24">
            <div className="animate-enter">
              <Badge className="mb-5 border-brand/20 bg-brand-soft/60 text-brand">
                <Sparkles className="size-3.5" /> Consent-first AI automation
              </Badge>
              <h1 className="text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[3.65rem]">
                From a sentence to a workflow <span className="text-brand">you can trust.</span>
              </h1>
              <p className="mt-6 max-w-xl text-balance text-base leading-7 text-muted sm:text-lg sm:leading-8">
                Describe the task. Clarify the details. Review exactly what will happen—then approve, test, and activate when you are ready.
              </p>
              <div className="mt-8"><TaskPrompt /></div>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted">
                {['No code required', 'Explicit approval', 'Versioned plans'].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="size-3.5 text-brand" />{item}</span>)}
              </div>
            </div>

            <div className="animate-enter-delay relative mx-auto w-full max-w-lg lg:mx-0">
              <div className="absolute -inset-8 rounded-[3rem] bg-brand/5 blur-2xl" />
              <Card className="relative overflow-hidden rounded-3xl shadow-[0_30px_90px_rgba(18,53,34,0.13)]">
                <div className="flex items-center justify-between border-b border-border bg-surface-raised/40 px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-8 place-items-center rounded-lg bg-brand-soft text-brand"><Workflow className="size-4" /></span>
                    <div><p className="text-sm font-bold">Morning news digest</p><p className="text-xs text-muted">Illustrative plan</p></div>
                  </div>
                  <Badge className="bg-surface text-[10px]">NOT RUNNING</Badge>
                </div>
                <div className="space-y-1 p-5">
                  {[
                    { icon: Clock3, title: "Weekdays at 8:00 AM", detail: "Asia/Jerusalem · schedule trigger" },
                    { icon: Globe2, title: "Read the approved API", detail: "Public HTTPS · bounded response" },
                    { icon: Sparkles, title: "Summarize the supplied content", detail: "External text treated as untrusted data" },
                    { icon: Mail, title: "Prepare the email step", detail: "Recipient confirmed before any live send" },
                  ].map((step, index) => (
                    <div key={step.title} className="relative flex gap-3.5 pb-4 last:pb-0">
                      {index < 3 ? <span className="absolute start-[15px] top-8 h-[calc(100%-1.2rem)] w-px bg-border" /> : null}
                      <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface text-brand"><step.icon className="size-4" /></span>
                      <div className="pt-0.5"><p className="text-sm font-semibold">{step.title}</p><p className="mt-1 text-xs leading-5 text-muted">{step.detail}</p></div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2.5 border-t border-border bg-brand-soft/45 px-5 py-4 text-xs font-medium text-foreground">
                  <LockKeyhole className="size-4 text-brand" /> Nothing executes until you approve.
                </div>
              </Card>
              <p className="relative mt-3 text-center text-xs text-muted">Example experience, not a live workflow or test result.</p>
            </div>
          </div>
        </section>

        <section id="features" className="container-shell py-20 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Clarity over complexity</p>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">Automation should explain itself.</h2>
            <p className="mt-4 text-base leading-7 text-muted">Every part of the core journey is designed to make the next decision understandable.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 transition hover:-translate-y-1 hover:shadow-lg">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><feature.icon className="size-5" /></span>
                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-border bg-surface">
          <div className="container-shell py-20 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <Badge><FileJson2 className="size-3.5" /> A controlled lifecycle</Badge>
                <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">You stay in the loop.</h2>
                <p className="mt-4 text-base leading-7 text-muted">Planning and execution are separate. A polished sentence is never treated as permission to act.</p>
                <Button asChild variant="outline" className="mt-7"><Link href="/register">Create your workspace <ArrowRight className="size-4" /></Link></Button>
              </div>
              <ol className="grid gap-4 sm:grid-cols-2">
                {[
                  ["01", "Describe & clarify", "Capture your intent and resolve missing details without losing context."],
                  ["02", "Check & approve", "Validate feasibility and approve an immutable, human-readable plan."],
                  ["03", "Connect & test", "Authorize only required services and distinguish dry runs from live actions."],
                  ["04", "Activate & monitor", "Control the lifecycle and inspect real step-by-step execution outcomes."],
                ].map(([number, title, detail]) => (
                  <li key={number} className="rounded-2xl border border-border bg-background p-5">
                    <span className="font-mono text-xs font-bold text-brand">{number}</span>
                    <h3 className="mt-3 font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="container-shell py-20 sm:py-24">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">Initial integration roadmap</p><h2 className="mt-3 text-3xl font-extrabold tracking-tight">A small, dependable toolkit.</h2></div>
            <p className="max-w-md text-sm leading-6 text-muted">No inflated integration wall. Capabilities become available only after their runtime and security checks are implemented.</p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Braces, name: "HTTP APIs", detail: "Constrained public HTTPS requests" },
              { icon: Mail, name: "Gmail", detail: "Consent-based email sending" },
              { icon: Sheet, name: "Google Sheets", detail: "Approved reads and row appends" },
            ].map((service) => (
              <Card key={service.name} className="flex items-center gap-4 p-5">
                <span className="grid size-11 place-items-center rounded-xl bg-surface-raised text-brand"><service.icon className="size-5" /></span>
                <div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{service.name}</h3><Badge className="px-2 py-0.5 text-[10px]">PHASE 4</Badge></div><p className="mt-1 text-xs text-muted">{service.detail}</p></div>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="border-y border-border bg-surface">
          <div className="container-shell grid items-center gap-8 py-16 md:grid-cols-[1fr_auto]">
            <div>
              <Badge className="mb-4">MVP · FREE PLAN ARCHITECTURE</Badge>
              <h2 className="text-3xl font-extrabold tracking-tight">Start with the essentials.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Billing is intentionally deferred. Server-enforced usage limits and any future pricing will be presented clearly before paid plans are introduced.</p>
            </div>
            <Button asChild size="lg"><Link href="/register">Create your account <ArrowRight className="size-4" /></Link></Button>
          </div>
        </section>

        <section className="container-shell py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-extrabold tracking-tight">Questions, answered clearly.</h2></div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {faqs.map(([question, answer]) => <Card key={question} className="p-5"><h3 className="font-bold">{question}</h3><p className="mt-2 text-sm leading-6 text-muted">{answer}</p></Card>)}
          </div>
        </section>

        <section className="container-shell pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-[#123e2e] px-6 py-12 text-center text-white sm:px-12 dark:bg-brand-soft dark:text-foreground">
            <CheckCircle2 className="mx-auto size-8 text-[#78e2ba]" />
            <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight">Your next automation starts with a sentence.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70 dark:text-muted">Create a personal workspace and follow the product as each verified capability becomes available.</p>
            <Button asChild size="lg" className="mt-7 bg-white text-[#123e2e] hover:bg-white/90 dark:bg-brand"><Link href="/register">Get started <ArrowRight className="size-4" /></Link></Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
