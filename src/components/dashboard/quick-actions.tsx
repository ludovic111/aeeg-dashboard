"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Nouvelle réunion",
      href: "/meetings/new",
      variant: "default" as const,
    },
    {
      label: "Nouvelle tâche",
      href: "/tasks?new=true",
      variant: "yellow" as const,
    },
    {
      label: "Voir commandes",
      href: "/orders",
      variant: "purple" as const,
    },
    {
      label: "Voir les tâches",
      href: "/tasks",
      variant: "coral" as const,
    },
    {
      label: "Soirées",
      href: "/parties",
      variant: "mint" as const,
    },
    {
      label: "Sondages",
      href: "/polls",
      variant: "outline" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {actions.map((action) => {
        return (
          <Button
            key={action.label}
            variant={action.variant}
            className="h-auto flex-col gap-2 py-3"
            onClick={() => router.push(action.href)}
          >
            <span className="caps-label text-center">{action.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
