"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AuthLayout } from "@/components/auth/auth-layout";
import { PasswordInput } from "@/components/auth/password-input";
import { FieldError } from "@/components/auth/field-error";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { currentUserKey, login } from "@/lib/auth";

const loginSchema = z.object({ email: z.string().trim().email("Enter a valid email."), password: z.string().min(1, "Enter your password.").max(128) });
type LoginInput = z.infer<typeof loginSchema>;

function safeNext(value: string | null): string {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  async function submit(input: LoginInput) {
    setError(undefined);
    try {
      const result = await login(input);
      queryClient.setQueryData(currentUserKey, result.user);
      const next = safeNext(params.get("next"));
      if (!result.user.onboardingCompleted) {
        try { sessionStorage.setItem("flowcapture.postOnboarding", next); } catch { /* Optional browser storage. */ }
        router.replace("/onboarding");
      } else {
        router.replace(next);
      }
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not sign in. Please try again.");
    }
  }

  return (
    <AuthLayout title="Welcome back" description="Sign in to your personal automation workspace.">
      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}
      <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
        <div><Label htmlFor="email">Email address</Label><Input id="email" className="mt-2" type="email" autoComplete="email" placeholder="you@example.com" dir="ltr" {...register("email")} /><FieldError message={errors.email?.message} /></div>
        <div><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><Link href="/forgot-password" className="text-xs font-semibold text-brand hover:underline">Forgot password?</Link></div><div className="mt-2"><PasswordInput id="password" placeholder="Your password" {...register("password")} /></div><FieldError message={errors.password?.message} /></div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Spinner label="Signing in" /> : null}Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New to FlowCapture? <Link href="/register" className="font-semibold text-brand hover:underline">Create an account</Link></p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-surface" />}><LoginForm /></Suspense>;
}
