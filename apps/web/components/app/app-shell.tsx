"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, MessageSquareText, Settings } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { UserProfileDto } from "@/lib/contracts";
import { logout } from "@/lib/auth";
import { cn, initials } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

const links = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/chat", label: "AI builder", icon: MessageSquareText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell({ user, children }: { user: UserProfileDto; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  async function signOut() {
    setError(undefined);
    try {
      await logout();
      queryClient.clear();
      router.replace("/login");
    } catch { setError("Could not sign out. Please try again."); }
  }
  return (
    <div dir={user.preferredLanguage === "ar" ? "rtl" : "ltr"} lang={user.preferredLanguage} className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container-shell flex h-17 items-center justify-between gap-4">
          <Logo href="/app" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Workspace navigation">
            {links.map((link) => <Link key={link.href} href={link.href} className={cn("rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-raised hover:text-foreground", pathname === link.href && "bg-surface-raised text-foreground")}>{link.label}</Link>)}
          </nav>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="mx-2 hidden items-center gap-2 sm:flex"><span className="grid size-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">{initials(user.displayName)}</span><span className="max-w-28 truncate text-sm font-semibold">{user.displayName}</span></div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut className="size-4" /></Button>
          </div>
        </div>
        <nav className="container-shell flex gap-1 overflow-x-auto pb-2 md:hidden" aria-label="Workspace navigation">
          {links.map((link) => <Link key={link.href} href={link.href} className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-muted", pathname === link.href && "bg-surface-raised text-foreground")}><link.icon className="size-4" />{link.label}</Link>)}
        </nav>
      </header>
      {error ? <div className="container-shell pt-4"><Alert tone="error">{error}</Alert></div> : null}
      <main className="container-shell py-8 sm:py-10">{children}</main>
    </div>
  );
}
