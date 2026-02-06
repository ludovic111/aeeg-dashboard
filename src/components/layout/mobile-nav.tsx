"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAV_ITEMS, isNavItemActive } from "@/lib/navigation";
import { useNavPrefetch } from "@/hooks/use-nav-prefetch";
import { Avatar } from "@/components/ui/avatar";
import type { Profile } from "@/types";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onSignOut: () => void;
}

export function MobileNav({
  isOpen,
  onClose,
  profile,
  onSignOut,
}: MobileNavProps) {
  const pathname = usePathname();
  const prefetchRoute = useNavPrefetch();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[88vw] max-w-72 bg-[var(--sidebar-bg)] border-r-4 border-[var(--border-color)] flex flex-col animate-in slide-in-from-left duration-200"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            <h1 className="text-xl font-black">AEEG</h1>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md border-2 border-[var(--border-color)] hover:bg-brutal-red hover:text-white transition-colors"
          >
            <X className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scroll-smooth overscroll-contain">
          {APP_NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                onTouchStart={() => prefetchRoute(item.href)}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ease-out active:scale-[0.99]",
                  isActive
                    ? "bg-brutal-yellow text-black border-2 border-[var(--border-color)] shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                    : "hover:bg-[var(--border-color)]/10"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 3 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        {profile && (
          <div className="p-4 border-t-2 border-[var(--border-color)]">
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
              </div>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="p-1.5 rounded-md border-2 border-[var(--border-color)] hover:bg-brutal-red hover:text-white transition-colors"
              >
                <LogOut className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
