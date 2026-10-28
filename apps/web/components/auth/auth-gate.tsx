"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import type { UserProfileDto } from "@/lib/contracts";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Logo } from "@/components/logo";

export function AuthGate({ children }: { children: (user: UserProfileDto) => React.ReactNode }) {
  const { data, isLoading, isError, error, refetch } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isError && error instanceof ApiError && error.status === 401) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isError, error, router, pathname]);

  useEffect(() => {
    if (data && !data.onboardingCompleted) {
      try { sessionStorage.setItem("flowcapture.postOnboarding", pathname); } catch { /* Optional storage. */ }
      router.replace("/onboarding");
    }
  }, [data, router, pathname]);

  if (isLoading || (isError && error instanceof ApiError && error.status === 401)) {
    return <main className="grid min-h-screen place-items-center"><div className="flex flex-col items-center gap-4"><Logo /><Spinner className="size-5 text-brand" /><span className="sr-only">Loading workspace</span></div></main>;
  }
  if (isError) {
    return <main className="container-shell grid min-h-screen place-items-center"><div className="max-w-md"><Alert tone="error" title="Workspace unavailable">{error instanceof Error ? error.message : "Could not load your account."}</Alert><Button onClick={() => void refetch()} className="mt-4 w-full">Try again</Button></div></main>;
  }
  if (!data || !data.onboardingCompleted) {
    return <main className="grid min-h-screen place-items-center"><Spinner className="size-5 text-brand" /></main>;
  }
  return <>{children(data)}</>;
}
