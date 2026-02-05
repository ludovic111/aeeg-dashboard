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
          ? "h-[2px] w-full border-t-2"
          : "h-full w-[2px] border-l-2",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };
