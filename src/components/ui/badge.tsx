import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[var(--radius-pill)] border border-[var(--border-color)] px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.08em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-transparent text-[var(--text-secondary)]",
        success:
          "bg-[color:color-mix(in_srgb,var(--accent-teal)_26%,transparent)] text-[var(--foreground)] border-[color:color-mix(in_srgb,var(--accent-teal)_50%,transparent)]",
        warning:
          "bg-[color:color-mix(in_srgb,var(--accent-yellow)_28%,transparent)] text-[var(--text-dark)] border-[color:color-mix(in_srgb,var(--accent-yellow)_68%,transparent)]",
        danger:
          "bg-[color:color-mix(in_srgb,var(--accent-orange)_22%,transparent)] text-[var(--accent-orange)] border-[color:color-mix(in_srgb,var(--accent-orange)_52%,transparent)]",
        info:
          "bg-[color:color-mix(in_srgb,var(--accent-teal)_20%,transparent)] text-[var(--foreground)] border-[color:color-mix(in_srgb,var(--accent-teal)_46%,transparent)]",
        purple:
          "bg-[color:color-mix(in_srgb,var(--accent-gold)_25%,transparent)] text-[var(--foreground)] border-[color:color-mix(in_srgb,var(--accent-gold)_55%,transparent)]",
        coral:
          "bg-[color:color-mix(in_srgb,var(--accent-orange)_20%,transparent)] text-[var(--foreground)] border-[color:color-mix(in_srgb,var(--accent-orange)_45%,transparent)]",
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
