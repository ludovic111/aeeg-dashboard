import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-[var(--radius-pill)] border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-gold)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
