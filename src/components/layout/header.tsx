"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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

  return (
    <header className="sticky top-0 z-30 lg:hidden flex items-center justify-between gap-2 px-3 py-2.5 bg-[var(--card-bg)] border-b-4 border-[var(--border-color)] backdrop-blur supports-[backdrop-filter]:bg-[var(--card-bg)]/95">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onMenuClick}>
          <Menu className="h-5 w-5" strokeWidth={3} />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <div>
            <h1 className="text-base sm:text-lg font-black leading-tight">AEEG</h1>
            <p className="text-[11px] font-bold text-[var(--foreground)]/60">
              {currentNavLabel}
            </p>
          </div>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
