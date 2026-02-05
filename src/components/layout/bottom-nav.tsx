"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t-4 border-[var(--border-color)] bg-[var(--sidebar-bg)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      aria-label="Navigation principale"
    >
      <ul className="flex gap-1 overflow-x-auto px-2 pt-2 pb-1">
        {APP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <li key={item.href} className="shrink-0 min-w-[84px]">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-black",
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
      </ul>
    </nav>
  );
}
