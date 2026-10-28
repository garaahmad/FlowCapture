"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { FieldError } from "@/components/auth/field-error";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, ApiError, jsonBody } from "@/lib/api";
import type { MessageResponse } from "@/lib/contracts";

const schema = z.object({ password: z.string().min(12, "Use at least 12 characters.").max(128) });
function ResetPassword() {
  const token = useSearchParams().get("token");
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ password: string }>({ resolver: zodResolver(schema), defaultValues: { password: "" } });
  async function submit(input: { password: string }) {
    if (!token) return;
    setError(undefined);
    try {
      const result = await apiFetch<MessageResponse>("/auth/reset-password", { method: "POST", body: jsonBody({ token, ...input }) });
      setMessage(result.message);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Password reset failed."); }
  }
  return (
    <AuthLayout title="Choose a new password" description="This resets your password and revokes your existing sessions.">
      {!token ? <Alert tone="error" className="mb-5">This reset link is missing its token.</Alert> : null}
      {message ? <Alert tone="success" className="mb-5">{message}</Alert> : null}
      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}
      {!message ? <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate><div><Label htmlFor="password">New password</Label><div className="mt-2"><PasswordInput id="password" autoComplete="new-password" {...register("password")} /></div><FieldError message={errors.password?.message} /></div><Button type="submit" className="w-full" disabled={!token || isSubmitting}>{isSubmitting ? <Spinner /> : null}Update password</Button></form> : <Button asChild className="w-full"><Link href="/login">Log in</Link></Button>}
    </AuthLayout>
  );
}
export default function ResetPasswordPage() { return <Suspense fallback={<div className="min-h-screen bg-surface" />}><ResetPassword /></Suspense>; }
