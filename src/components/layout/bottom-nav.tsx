"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_PRIMARY_NAV_ITEMS, isNavItemActive } from "@/lib/navigation";
import { useNavPrefetch } from "@/hooks/use-nav-prefetch";

interface BottomNavProps {
  onMenuClick: () => void;
}

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const pathname = usePathname();
  const prefetchRoute = useNavPrefetch();

  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t-4 border-[var(--border-color)] bg-[var(--sidebar-bg)]/95 backdrop-blur shadow-[0_-6px_18px_rgba(0,0,0,0.12)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      aria-label="Navigation principale"
    >
      <ul className="grid grid-cols-5 gap-1 px-2 pt-2 pb-1">
        {MOBILE_PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                onTouchStart={() => prefetchRoute(item.href)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-black transition-all duration-200 ease-out active:scale-[0.98]",
                  isActive
                    ? "bg-brutal-yellow text-black border-2 border-[var(--border-color)]"
                    : "text-[var(--foreground)]/70"
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={isActive ? 3 : 2} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMenuClick}
            className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-black text-[var(--foreground)]/70 transition-all duration-200 ease-out active:scale-[0.98]"
          >
            <Menu className="h-4 w-4" strokeWidth={2.5} />
            <span className="truncate">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
