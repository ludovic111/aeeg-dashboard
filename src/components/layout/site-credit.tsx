import { cn } from "@/lib/utils";

interface SiteCreditProps {
  className?: string;
}

export function SiteCredit({ className }: SiteCreditProps) {
  return (
    <p className={cn("text-xs font-bold text-[var(--foreground)]/60", className)}>
      Fait avec amour par Ludovic et Codex.
    </p>
  );
}
