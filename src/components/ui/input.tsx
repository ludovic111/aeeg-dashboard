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
        "flex h-10 w-full rounded-lg border-2 border-[var(--border-color)] bg-[var(--input-bg)] px-3 py-2 text-sm font-mono shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-shadow placeholder:text-[var(--foreground)]/40 focus:shadow-[4px_4px_0px_0px_var(--shadow-color)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
