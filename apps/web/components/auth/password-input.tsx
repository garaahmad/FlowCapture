"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} autoComplete={props.autoComplete ?? "current-password"} className="pe-11" {...props} />
        <button type="button" onClick={() => setVisible(!visible)} className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-e-xl text-muted outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand" aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    );
  },
);
