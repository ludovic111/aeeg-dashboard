"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll when open
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

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    // Auto-focus close button on open
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu de navigation">
      <div
        className="absolute inset-0 bg-black/62 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        className="absolute right-0 top-0 bottom-0 flex w-[92vw] max-w-[420px] flex-col border-l border-[var(--border-color)] bg-[var(--sidebar-bg)]/95 backdrop-blur-2xl [-webkit-backdrop-filter:blur(20px)] animate-in slide-in-from-right duration-200"
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      >
        <div className="flex items-start justify-between border-b border-[var(--border-color)] p-5">
          <div>
            <p className="caps-label">Site map</p>
            <h1 className="font-[var(--font-display)] text-4xl leading-[0.9] tracking-[-0.02em]">
              AEEG
            </h1>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-color)] transition-colors duration-200 hover:bg-[var(--foreground)] hover:text-[var(--background)]"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" strokeWidth={3} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4" role="navigation" aria-label="Navigation principale">
          {APP_NAV_ITEMS.map((item, index) => {
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                onTouchStart={() => prefetchRoute(item.href)}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-[48px] items-center justify-between rounded-[var(--radius-card)] border px-4 py-3 text-[15px] transition-colors duration-200",
                  isActive
                    ? "border-[var(--accent-yellow)] bg-[color:color-mix(in_srgb,var(--accent-yellow)_22%,transparent)] text-[var(--foreground)]"
                    : "border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--foreground)]"
                )}
              >
                <span className="font-medium">{item.label}</span>
                <span className="mono-meta text-[var(--text-muted)]">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </Link>
            );
          })}
        </nav>

        {profile && (
          <div className="border-t border-[var(--border-color)] p-4">
            <div className="flex items-center gap-3">
              <Avatar
                name={profile.full_name || profile.email}
                src={profile.avatar_url}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">
                  {profile.full_name || profile.email}
                </p>
                <p className="mono-meta mt-1 text-[var(--text-muted)]">
                  {profile.email}
                </p>
              </div>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="inline-flex h-10 items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--border-color)] px-3.5 text-xs font-semibold uppercase tracking-[0.08em] transition-colors duration-200 hover:bg-[var(--foreground)] hover:text-[var(--background)]"
                aria-label="Se deconnecter"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={2.7} />
                Sortir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
