"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/navigation";
import { ThemeToggle } from "./theme-toggle";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const currentNavLabel = useMemo(() => {
    const activeItem = APP_NAV_ITEMS.find((item) =>
      isNavItemActive(pathname, item.href)
    );
    return activeItem?.label || "Navigation";
  }, [pathname]);

  const quickNav = useMemo(
    () => APP_NAV_ITEMS.filter((item) => item.href === "/" || item.href === "/tasks"),
    []
  );

  return (
    <header className="animate-nav-load sticky top-0 z-40 border-b border-[var(--border-color)] bg-[var(--background)]/70 backdrop-blur-2xl [-webkit-backdrop-filter:blur(20px)]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-4 py-2.5 sm:py-3 sm:px-6 md:px-10 lg:px-14">
        <Link href="/" className="min-w-0">
          <p className="caps-label">Association d&apos;eleves d&apos;Emilie Gourd</p>
          <p className="text-[1.8rem] leading-none tracking-[-0.02em] font-[var(--font-display)]">
            AEEG
          </p>
          <p className="mono-meta mt-1 truncate text-[var(--text-muted)]">
            {currentNavLabel}
          </p>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation rapide">
            {quickNav.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="rounded-[var(--radius-pill)] px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-[var(--text-secondary)] transition-colors hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <ThemeToggle />

          <Button variant="yellow" size="sm" onClick={onMenuClick}>
            <Menu className="h-4 w-4" strokeWidth={2.6} />
            Menu
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.6} />
          </Button>
        </div>
      </div>
    </header>
  );
}
