import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  accentColor?: string;
  accentPosition?: "top" | "left";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accentColor, accentPosition = "top", style, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[1.1rem] border border-[var(--border-color)] bg-[var(--card-bg)] transition-colors",
        className
      )}
      style={{
        ...(accentColor && accentPosition === "top"
          ? { borderTopWidth: "2px", borderTopColor: accentColor }
          : {}),
        ...(accentColor && accentPosition === "left"
          ? { borderLeftWidth: "2px", borderLeftColor: accentColor }
          : {}),
        ...style,
      }}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "font-[var(--font-display)] text-[1.4rem] leading-tight tracking-[-0.015em]",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-[var(--text-secondary)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "mt-4 flex items-center border-t border-[var(--border-color)] p-4 pt-4 sm:p-6 sm:pt-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
