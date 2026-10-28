"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Globe2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { currentUserKey, updateProfile, useCurrentUser } from "@/lib/auth";
import type { UsageCategory } from "@/lib/contracts";

const schema = z.object({
  preferredLanguage: z.enum(["en", "ar"]),
  timezone: z.string().min(1).max(100),
  usageCategory: z.union([z.enum(["personal", "business", "developer"]), z.literal("")]),
});
type OnboardingInput = z.infer<typeof schema>;

function destination(): string {
  try {
    const value = sessionStorage.getItem("flowcapture.postOnboarding") ?? "/app";
    sessionStorage.removeItem("flowcapture.postOnboarding");
    return value.startsWith("/") && !value.startsWith("//") ? value : "/app";
  } catch { return "/app"; }
}

export default function OnboardingPage() {
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();
  const router = useRouter();
  useEffect(() => {
    if (isError && error instanceof ApiError && error.status === 401) router.replace("/login?next=%2Fonboarding");
    if (user?.onboardingCompleted) router.replace("/app");
  }, [user, isError, error, router]);
  if (isLoading) return <main className="grid min-h-screen place-items-center"><Spinner className="size-5 text-brand" /></main>;
  if (isError && !(error instanceof ApiError && error.status === 401)) return <main className="container-shell grid min-h-screen place-items-center"><div className="max-w-md"><Alert tone="error">Could not load your account.</Alert><Button onClick={() => void refetch()} className="mt-4 w-full">Try again</Button></div></main>;
  if (!user || user.onboardingCompleted) return <main className="grid min-h-screen place-items-center"><Spinner className="size-5 text-brand" /></main>;
  return <OnboardingForm key={user.id} />;
}

function OnboardingForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<OnboardingInput>({
    resolver: zodResolver(schema),
    defaultValues: { preferredLanguage: "en", timezone: browserTimezone, usageCategory: "" },
  });
  const language = useWatch({ control, name: "preferredLanguage" });

  async function submit(input: OnboardingInput) {
    setError(undefined);
    try {
      const user = await updateProfile({
        preferredLanguage: input.preferredLanguage,
        timezone: input.timezone,
        usageCategory: (input.usageCategory || null) as UsageCategory | null,
        completeOnboarding: true,
      });
      queryClient.setQueryData(currentUserKey, user);
      router.replace(destination());
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not save your preferences."); }
  }

  return (
    <main dir={language === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-background">
      <div className="container-shell flex h-18 items-center justify-between"><Logo /><ThemeToggle /></div>
      <div className="container-shell grid max-w-3xl place-items-center py-10 sm:py-16">
        <Card className="w-full p-6 sm:p-9">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><Globe2 className="size-5" /></span>
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-brand">Your workspace</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">A few useful preferences</h1>
          <p className="mt-3 text-sm leading-6 text-muted">These settings localize your experience and future schedules. Usage category is optional.</p>
          {error ? <Alert tone="error" className="mt-5">{error}</Alert> : null}
          <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-5">
            <div><Label htmlFor="language">Preferred language</Label><select id="language" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" {...register("preferredLanguage")}><option value="en">English</option><option value="ar">العربية</option></select></div>
            <div><Label htmlFor="timezone">Timezone</Label><input id="timezone" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" autoComplete="off" {...register("timezone")} /><p className="mt-2 text-xs text-muted">Use an IANA timezone, such as Asia/Jerusalem or UTC.</p></div>
            <div><Label htmlFor="usageCategory">What will you use FlowCapture for? <span className="font-normal text-muted">(optional)</span></Label><select id="usageCategory" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" {...register("usageCategory")}><option value="">Prefer not to say</option><option value="personal">Personal</option><option value="business">Business</option><option value="developer">Developer</option></select></div>
            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
              <Button type="submit" variant="ghost" disabled={isSubmitting}>Skip optional question</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Spinner /> : null}Enter workspace <ArrowRight className="size-4" /></Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  );
}
