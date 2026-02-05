import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  PackageSearch,
  MessageSquareWarning,
  CircleUserRound,
  Users,
  Vote,
  FolderOpen,
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
  { href: "/polls", label: "Sondages", icon: Vote },
  { href: "/files", label: "Fichiers", icon: FolderOpen },
  { href: "/feedback", label: "Retours", icon: MessageSquareWarning },
  { href: "/profile", label: "Profil", icon: CircleUserRound },
  { href: "/members", label: "Membres", icon: Users },
];

export const MOBILE_PRIMARY_NAV_ITEMS: AppNavItem[] = APP_NAV_ITEMS.filter(
  (item) =>
    item.href === "/" ||
    item.href === "/meetings" ||
    item.href === "/tasks" ||
    item.href === "/orders"
);

export function isNavItemActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}
