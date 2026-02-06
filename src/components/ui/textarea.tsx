import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[96px] w-full resize-none rounded-[var(--radius-card)] border border-[var(--border-color)] bg-[var(--input-bg)] px-4 py-3 text-[16px] font-medium text-[var(--foreground)] transition-colors duration-200 placeholder:text-[var(--text-secondary)] focus:border-[var(--accent-gold)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
