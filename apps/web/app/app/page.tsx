"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, MailWarning, ShieldCheck, Workflow } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, ApiError } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import type { MessageResponse } from "@/lib/contracts";

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  if (!user) return null;
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold text-brand">Personal workspace</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight">Welcome, {user.displayName}.</h1><p className="mt-2 text-sm text-muted">Your account and workspace are ready.</p></div>
        <Badge className="w-fit border-brand/20 bg-brand-soft/60 text-brand"><CheckCircle2 className="size-3.5" /> FOUNDATION ACTIVE</Badge>
      </div>
      {!user.emailVerified ? <VerificationNotice /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader><span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><ShieldCheck className="size-5" /></span><CardTitle className="mt-3">Workspace secured</CardTitle><CardDescription>Your profile, preferences, and revocable session are backed by the identity API.</CardDescription></CardHeader>
          <CardContent><dl className="space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted">Plan</dt><dd className="font-semibold capitalize">{user.workspace.planCode}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Timezone</dt><dd className="font-semibold" dir="ltr">{user.timezone}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted">Language</dt><dd className="font-semibold">{user.preferredLanguage === "ar" ? "العربية" : "English"}</dd></div></dl></CardContent>
        </Card>
        <Card className="border-dashed bg-surface/60">
          <CardHeader><span className="grid size-10 place-items-center rounded-xl bg-surface-raised text-muted"><Workflow className="size-5" /></span><CardTitle className="mt-3">Plan before you automate</CardTitle><CardDescription>Start a persisted conversation, answer grounded clarification questions, and review an immutable plan. Workflow execution is not enabled yet.</CardDescription></CardHeader>
          <CardContent><p className="text-xs leading-5 text-muted">No sample workflows or simulated run results are shown.</p><Button asChild className="mt-4"><Link href="/app/chat">Start a plan</Link></Button></CardContent>
        </Card>
      </div>
    </div>
  );
}

function VerificationNotice() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  async function resend() {
    setBusy(true); setError(undefined); setMessage(undefined);
    try {
      const result = await apiFetch<MessageResponse>("/auth/resend-verification", { method: "POST" });
      setMessage(result.message);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not request verification."); }
    finally { setBusy(false); }
  }
  return <Alert tone="info" title="Email verification pending"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p>Verify your email when delivery is configured for this environment.</p><Button variant="outline" size="sm" onClick={resend} disabled={busy}>{busy ? <Spinner /> : <MailWarning className="size-4" />}Resend link</Button></div>{message ? <p className="mt-2 text-success">{message}</p> : null}{error ? <p className="mt-2 text-danger">{error}</p> : null}</Alert>;
}
