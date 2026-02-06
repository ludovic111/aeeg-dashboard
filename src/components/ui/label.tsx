import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-[0.7rem] font-semibold uppercase tracking-[0.1em] leading-none text-[var(--text-secondary)]",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
