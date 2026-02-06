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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-color)] bg-[var(--sidebar-bg)]/95 backdrop-blur lg:hidden"
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
                prefetch={false}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                onTouchStart={() => prefetchRoute(item.href)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-element)] border border-transparent px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors",
                  isActive
                    ? "border-[var(--accent-yellow)] bg-[color:color-mix(in_srgb,var(--accent-yellow)_24%,transparent)] text-[var(--foreground)]"
                    : "text-[var(--text-secondary)]"
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
            className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-[var(--radius-element)] border border-transparent px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors"
          >
            <Menu className="h-4 w-4" strokeWidth={2.5} />
            <span className="truncate">Menu</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
