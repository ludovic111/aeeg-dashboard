import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("brutal-skeleton rounded-lg", className)}
      {...props}
    />
  );
}

export { Skeleton };
