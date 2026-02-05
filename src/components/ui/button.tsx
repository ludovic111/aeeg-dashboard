import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all duration-150 border-2 border-[var(--border-color)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-color)] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-brutal-teal text-black shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-y-1 active:shadow-none",
        destructive:
          "bg-brutal-red text-white shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-y-1 active:shadow-none",
        outline:
          "bg-[var(--card-bg)] text-[var(--foreground)] shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-y-1 active:shadow-none",
        ghost:
          "border-transparent shadow-none hover:bg-[var(--border-color)]/10",
        yellow:
          "bg-brutal-yellow text-black shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-y-1 active:shadow-none",
        purple:
          "bg-brutal-purple text-black shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-y-1 active:shadow-none",
        coral:
          "bg-brutal-coral text-black shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-y-1 active:shadow-none",
        mint:
          "bg-brutal-mint text-black shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] active:translate-y-1 active:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
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
