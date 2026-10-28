import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthLayout({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="relative hidden overflow-hidden bg-[#123e2e] p-12 text-white lg:flex lg:flex-col lg:justify-between dark:bg-[#102b20]">
        <div className="hero-grid absolute inset-0 opacity-20" />
        <Logo href="/" className="relative text-white [&_span]:text-white" />
        <div className="relative max-w-md">
          <ShieldCheck className="size-9 text-[#78e2ba]" />
          <h2 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight">Your workspace. Your approval. Your control.</h2>
          <ul className="mt-8 space-y-4 text-sm text-white/75">
            {["Opaque, revocable sign-in sessions", "A personal, isolated workspace", "No automation runs without consent"].map((item) => <li key={item} className="flex items-center gap-3"><Check className="size-4 text-[#78e2ba]" />{item}</li>)}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">FlowCapture AI · Consent-first automation</p>
      </aside>
      <section className="relative flex min-h-screen flex-col px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between lg:justify-end"><Logo className="lg:hidden" /><ThemeToggle /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-center text-xs text-muted">By continuing, you agree to the <Link href="/terms" className="underline hover:text-foreground">terms</Link> and <Link href="/privacy" className="underline hover:text-foreground">privacy policy</Link>.</p>
      </section>
    </main>
  );
}
