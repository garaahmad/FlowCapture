"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, ApiError, jsonBody } from "@/lib/api";
import type { MessageResponse } from "@/lib/contracts";

function VerifyEmail() {
  const token = useSearchParams().get("token");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  async function verify() {
    if (!token) return;
    setBusy(true); setError(undefined);
    try {
      const result = await apiFetch<MessageResponse>("/auth/verify-email", { method: "POST", body: jsonBody({ token }) });
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Verification failed.");
    } finally { setBusy(false); }
  }
  return (
    <AuthLayout title="Verify your email" description="Confirm this single-use verification link.">
      {!token ? <Alert tone="error">This verification link is missing its token.</Alert> : null}
      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error" className="mt-4">{error}</Alert> : null}
      {!message ? <Button onClick={verify} disabled={!token || busy} className="mt-5 w-full">{busy ? <Spinner /> : null}Verify email</Button> : <Button asChild className="mt-5 w-full"><Link href="/app">Open workspace</Link></Button>}
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="min-h-screen bg-surface" />}><VerifyEmail /></Suspense>;
}
