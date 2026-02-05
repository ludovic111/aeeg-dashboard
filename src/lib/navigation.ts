import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  PackageSearch,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AppNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/meetings", label: "Réunions", icon: ClipboardList },
  { href: "/tasks", label: "Tâches", icon: CheckSquare },
  { href: "/orders", label: "Commandes", icon: PackageSearch },
  { href: "/members", label: "Membres", icon: Users },
];

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}
