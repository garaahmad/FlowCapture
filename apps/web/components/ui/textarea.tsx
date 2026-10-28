import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn("flex min-h-28 w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-3 text-sm leading-6 text-foreground shadow-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-50", className)}
        {...props}
      />
    );
  },
);
