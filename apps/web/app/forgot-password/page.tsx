"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthLayout } from "@/components/auth/auth-layout";
import { FieldError } from "@/components/auth/field-error";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, ApiError, jsonBody } from "@/lib/api";
import type { MessageResponse } from "@/lib/contracts";

const schema = z.object({ email: z.string().trim().email("Enter a valid email.") });
type Input = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Input>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  async function submit(input: Input) {
    setError(undefined); setMessage(undefined);
    try {
      const result = await apiFetch<MessageResponse>("/auth/forgot-password", { method: "POST", body: jsonBody(input) });
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "The request could not be completed.");
    }
  }
  return (
    <AuthLayout title="Reset your password" description="Enter your account email. Reset links are single-use and expire after 30 minutes.">
      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}
      {message ? <Alert tone="success" className="mb-5">{message}</Alert> : null}
      <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
        <div><Label htmlFor="email">Email address</Label><Input id="email" className="mt-2" type="email" autoComplete="email" dir="ltr" {...register("email")} /><FieldError message={errors.email?.message} /></div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : null}Request reset link</Button>
      </form>
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-brand hover:underline">Back to login</Link></p>
    </AuthLayout>
  );
}
