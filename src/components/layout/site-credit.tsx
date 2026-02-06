import { cn } from "@/lib/utils";

interface SiteCreditProps {
  className?: string;
}

export function SiteCredit({ className }: SiteCreditProps) {
  return (
    <p
      className={cn(
        "mono-meta text-[var(--text-muted)]",
        className
      )}
    >
      Fait avec amour par Ludovic et Codex.
    </p>
  );
}
