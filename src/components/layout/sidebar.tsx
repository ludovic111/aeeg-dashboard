"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/navigation";
import { useNavPrefetch } from "@/hooks/use-nav-prefetch";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import type { Profile } from "@/types";

interface SidebarProps {
  profile: Profile | null;
  onSignOut: () => void;
}

export function Sidebar({ profile, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const prefetchRoute = useNavPrefetch();

  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] lg:flex">
      <div className="border-b border-[var(--border-color)] p-6">
        <Link href="/" className="flex items-center gap-2">
          <div>
            <h1 className="font-[var(--font-display)] text-3xl leading-none">AEEG</h1>
            <p className="caps-label text-[var(--text-secondary)]">
              Dashboard
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scroll-smooth">
        {APP_NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              onMouseEnter={() => prefetchRoute(item.href)}
              onFocus={() => prefetchRoute(item.href)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-card)] border border-transparent px-3 py-2.5 text-sm transition-colors",
                isActive
                  ? "border-[var(--accent-yellow)] bg-[color:color-mix(in_srgb,var(--accent-yellow)_20%,transparent)] text-[var(--foreground)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={isActive ? 2.8 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 pb-2">
        <ThemeToggle />
      </div>

      <div className="border-t border-[var(--border-color)] p-4">
        {profile && (
          <div className="flex items-center gap-3">
            <Avatar
              name={profile.full_name || profile.email}
              src={profile.avatar_url}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">
                {profile.full_name || profile.email}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {profile.email}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="rounded-full border border-[var(--border-color)] p-1.5 transition-colors hover:bg-[var(--foreground)] hover:text-[var(--background)]"
              aria-label="Se déconnecter"
            >
              <LogOut className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
