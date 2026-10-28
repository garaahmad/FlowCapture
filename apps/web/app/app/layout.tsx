"use client";

import { AuthGate } from "@/components/auth/auth-gate";
import { AppShell } from "@/components/app/app-shell";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{(user) => <AppShell user={user}>{children}</AppShell>}</AuthGate>;
}
