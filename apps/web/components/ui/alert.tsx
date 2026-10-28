import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertProps {
  tone?: "info" | "success" | "error";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm leading-6",
        tone === "error" && "border-danger/30 bg-danger/5 text-danger",
        tone === "success" && "border-brand/30 bg-brand-soft/60 text-foreground",
        tone === "info" && "border-border bg-surface-raised/70 text-muted",
        className,
      )}
    >
      <Icon className="mt-1 size-4 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="font-semibold text-foreground">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
