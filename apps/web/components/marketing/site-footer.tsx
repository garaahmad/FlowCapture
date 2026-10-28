import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-shell flex flex-col gap-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-3">Natural-language automation with human approval.</p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal and contact">
          <Link className="hover:text-foreground" href="/privacy">Privacy</Link>
          <Link className="hover:text-foreground" href="/terms">Terms</Link>
          <a className="hover:text-foreground" href="https://github.com/garaahmad/FlowCapture/issues" target="_blank" rel="noreferrer">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
