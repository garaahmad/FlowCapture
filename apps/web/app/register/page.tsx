"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { currentUserKey, register as registerAccount } from "@/lib/auth";

const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.string().trim().email("Enter a valid email address.").max(320),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
});
type RegisterInput = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  });

  async function submit(input: RegisterInput) {
    setError(undefined);
    try {
      const result = await registerAccount(input);
      queryClient.setQueryData(currentUserKey, result.user);
      router.replace("/onboarding");
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Could not create your account. Please try again.");
    }
  }

  return (
    <AuthLayout title="Create your workspace" description="One account for your conversations, workflows, and connections.">
      {error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}
      <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
        <div><Label htmlFor="displayName">Your name</Label><Input id="displayName" className="mt-2" autoComplete="name" placeholder="How should we address you?" {...register("displayName")} /><FieldError message={errors.displayName?.message} /></div>
        <div><Label htmlFor="email">Email address</Label><Input id="email" className="mt-2" type="email" autoComplete="email" placeholder="you@example.com" dir="ltr" {...register("email")} /><FieldError message={errors.email?.message} /></div>
        <div><Label htmlFor="password">Password</Label><div className="mt-2"><PasswordInput id="password" autoComplete="new-password" placeholder="At least 12 characters" {...register("password")} /></div><FieldError message={errors.password?.message} /><p className="mt-2 text-xs leading-5 text-muted">Use a long, unique password. It is hashed with Argon2id and never returned by the API.</p></div>
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? <Spinner label="Creating account" /> : null}Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Log in</Link></p>
    </AuthLayout>
  );
}
