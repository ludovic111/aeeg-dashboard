import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("brutal-skeleton rounded-[var(--radius-element)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
