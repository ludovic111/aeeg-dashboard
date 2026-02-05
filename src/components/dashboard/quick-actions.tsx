"use client";

import { useRouter } from "next/navigation";
import { Plus, ClipboardList, CheckSquare, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Nouvelle réunion",
      icon: ClipboardList,
      href: "/meetings/new",
      variant: "default" as const,
    },
    {
      label: "Nouvelle tâche",
      icon: Plus,
      href: "/tasks?new=true",
      variant: "yellow" as const,
    },
    {
      label: "Voir commandes",
      icon: PackageSearch,
      href: "/orders",
      variant: "purple" as const,
    },
    {
      label: "Voir les tâches",
      icon: CheckSquare,
      href: "/tasks",
      variant: "coral" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.label}
            variant={action.variant}
            className="h-auto py-3 flex-col gap-2"
            onClick={() => router.push(action.href)}
          >
            <Icon className="h-5 w-5" strokeWidth={3} />
            <span className="text-xs">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
