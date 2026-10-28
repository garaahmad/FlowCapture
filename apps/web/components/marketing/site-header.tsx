"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const navigation = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="container-shell flex h-18 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="rounded-md text-sm font-medium text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">Log in</Link></Button>
          <Button asChild size="sm" className="hidden sm:inline-flex"><Link href="/register">Get started</Link></Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>
      {open ? (
        <nav id="mobile-navigation" className="border-t border-border bg-surface p-4 md:hidden" aria-label="Mobile navigation">
          <div className="container-shell flex flex-col gap-1">
            {navigation.map((item) => <a key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-surface-raised">{item.label}</a>)}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-3">
              <Button asChild variant="outline"><Link href="/login">Log in</Link></Button>
              <Button asChild><Link href="/register">Get started</Link></Button>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
