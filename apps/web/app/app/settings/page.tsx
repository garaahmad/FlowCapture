"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { currentUserKey, updateProfile, useCurrentUser } from "@/lib/auth";

interface SettingsInput {
  displayName: string;
  preferredLanguage: "en" | "ar";
  timezone: string;
  usageCategory: "personal" | "business" | "developer" | "";
  dateFormat: "system" | "MDY" | "DMY" | "YMD";
}

export default function SettingsPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const { register, handleSubmit, formState: { isSubmitting, isDirty } } = useForm<SettingsInput>({
    values: {
      displayName: user?.displayName ?? "",
      preferredLanguage: user?.preferredLanguage ?? "en",
      timezone: user?.timezone ?? "UTC",
      usageCategory: user?.usageCategory ?? "",
      dateFormat: user?.dateFormat ?? "system",
    },
  });
  async function submit(input: SettingsInput) {
    setMessage(undefined); setError(undefined);
    try {
      const updated = await updateProfile({ ...input, usageCategory: input.usageCategory || null });
      queryClient.setQueryData(currentUserKey, updated);
      setMessage("Profile settings saved.");
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : "Could not save settings."); }
  }
  if (!user) return null;
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-extrabold tracking-tight">Profile settings</h1><p className="mt-2 text-sm text-muted">Manage your identity and workspace preferences.</p>
      <Card className="mt-7">
        <CardHeader><CardTitle>Preferences</CardTitle><CardDescription>Timezone changes can affect schedules. Existing workflows will require explicit review in the workflow phase.</CardDescription></CardHeader>
        <CardContent>
          {message ? <Alert tone="success" className="mb-5">{message}</Alert> : null}{error ? <Alert tone="error" className="mb-5">{error}</Alert> : null}
          <form onSubmit={handleSubmit(submit)} className="space-y-5">
            <div><Label htmlFor="displayName">Display name</Label><Input id="displayName" className="mt-2" required minLength={1} maxLength={80} {...register("displayName")} /></div>
            <div><Label htmlFor="email">Email</Label><Input id="email" className="mt-2" value={user.email} disabled dir="ltr" /><p className="mt-2 text-xs text-muted">Email changes and account deletion are not available in this phase.</p></div>
            <div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="language">Language</Label><select id="language" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" {...register("preferredLanguage")}><option value="en">English</option><option value="ar">العربية</option></select></div><div><Label htmlFor="dateFormat">Date format</Label><select id="dateFormat" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" {...register("dateFormat")}><option value="system">System default</option><option value="MDY">MM/DD/YYYY</option><option value="DMY">DD/MM/YYYY</option><option value="YMD">YYYY-MM-DD</option></select></div></div>
            <div><Label htmlFor="timezone">IANA timezone</Label><Input id="timezone" className="mt-2" required dir="ltr" {...register("timezone")} /></div>
            <div><Label htmlFor="usageCategory">Usage category</Label><select id="usageCategory" className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm" {...register("usageCategory")}><option value="">Not specified</option><option value="personal">Personal</option><option value="business">Business</option><option value="developer">Developer</option></select></div>
            <Button type="submit" disabled={isSubmitting || !isDirty}>{isSubmitting ? <Spinner /> : null}Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
