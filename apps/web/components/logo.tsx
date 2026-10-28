import Link from "next/link";
import { Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", compact = false, className }: { href?: string; compact?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2.5 rounded-lg font-bold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-brand", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-brand text-white shadow-sm dark:text-[#0b2117]">
        <Waypoints className="size-5" strokeWidth={2.2} aria-hidden="true" />
      </span>
      {!compact ? <span className="text-lg">FlowCapture <span className="text-brand">AI</span></span> : null}
    </Link>
  );
}
