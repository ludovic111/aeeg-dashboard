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
        "rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all",
        className
      )}
      style={{
        ...(accentColor && accentPosition === "top"
          ? { borderTopWidth: "4px", borderTopColor: accentColor }
          : {}),
        ...(accentColor && accentPosition === "left"
          ? { borderLeftWidth: "4px", borderLeftColor: accentColor }
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
    className={cn("text-lg font-black leading-none tracking-tight", className)}
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
    className={cn("text-sm text-[var(--foreground)]/70", className)}
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
      "flex items-center p-4 sm:p-6 pt-0 border-t-2 border-[var(--border-color)] mt-4 pt-4",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
