"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  PackageSearch,
  CalendarDays,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import type { Profile } from "@/types";

const navItems = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/meetings", label: "Réunions", icon: ClipboardList },
  { href: "/tasks", label: "Tâches", icon: CheckSquare },
  { href: "/orders", label: "Commandes", icon: PackageSearch },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays },
  { href: "/members", label: "Membres", icon: Users },
];

interface SidebarProps {
  profile: Profile | null;
  onSignOut: () => void;
}

export function Sidebar({ profile, onSignOut }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[var(--sidebar-bg)] border-r-4 border-[var(--border-color)]">
      {/* Logo */}
      <div className="p-6 border-b-2 border-[var(--border-color)]">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <div>
            <h1 className="text-xl font-black leading-tight">AEEG</h1>
            <p className="text-xs font-bold text-[var(--foreground)]/60">
              Dashboard
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all",
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

      {/* Theme Toggle */}
      <div className="px-4 pb-2">
        <ThemeToggle />
      </div>

      {/* User */}
      <div className="p-4 border-t-2 border-[var(--border-color)]">
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
              <p className="text-xs text-[var(--foreground)]/60 truncate">
                {profile.email}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-md border-2 border-[var(--border-color)] hover:bg-brutal-red hover:text-white transition-colors"
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
