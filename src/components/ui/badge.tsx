import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border-2 border-[var(--border-color)] px-2.5 py-0.5 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--card-bg)] text-[var(--foreground)]",
        success: "bg-brutal-mint text-black",
        warning: "bg-brutal-yellow text-black",
        danger: "bg-brutal-red text-white",
        info: "bg-brutal-teal text-black",
        purple: "bg-brutal-purple text-black",
        coral: "bg-brutal-coral text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
