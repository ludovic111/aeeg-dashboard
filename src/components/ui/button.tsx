import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] border border-[var(--border-color)] px-5 text-sm font-medium transition-colors duration-200 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-yellow)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-yellow)] border-[var(--accent-yellow)] text-[var(--text-dark)] hover:opacity-90",
        destructive:
          "bg-transparent text-[var(--accent-orange)] border-[color:color-mix(in_srgb,var(--accent-orange)_55%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--accent-orange)_14%,transparent)]",
        outline:
          "bg-transparent text-[var(--foreground)] hover:bg-[var(--foreground)] hover:text-[var(--background)]",
        ghost:
          "border-transparent text-[var(--text-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10",
        yellow:
          "bg-[var(--accent-yellow)] border-[var(--accent-yellow)] text-[var(--text-dark)] hover:opacity-90",
        purple:
          "bg-[var(--accent-gold)] border-[var(--accent-gold)] text-[var(--text-dark)] hover:opacity-90",
        coral:
          "bg-[var(--accent-orange)] border-[var(--accent-orange)] text-[var(--text-primary)] hover:opacity-90",
        mint:
          "bg-[var(--accent-teal)] border-[var(--accent-teal)] text-[var(--text-primary)] hover:opacity-90",
      },
      size: {
        default: "h-10 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
