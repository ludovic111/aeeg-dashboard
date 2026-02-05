import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "d MMMM yyyy", { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "d MMMM yyyy 'à' HH:mm", { locale: fr });
}

export function formatShortDate(date: string | Date): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: fr });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm", { locale: fr });
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
  }).format(amount);
}
