import * as React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "shrink-0 border-[var(--border-color)]",
        orientation === "horizontal"
          ? "h-px w-full border-t"
          : "h-full w-px border-l",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };
