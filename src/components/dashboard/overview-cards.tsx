"use client";

import { Banknote, CheckSquare, PackageSearch, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface OverviewCardsProps {
  taskCount: number;
  ordersCount: number;
  salesTotalChf: number;
  memberCount: number;
}

export function OverviewCards({
  taskCount,
  ordersCount,
  salesTotalChf,
  memberCount,
}: OverviewCardsProps) {
  const cards = [
    {
      title: "Tâches en cours",
      value: String(taskCount),
      subtitle: "tâches actives",
      icon: CheckSquare,
      color: "var(--card-accent-yellow)",
    },
    {
      title: "Commandes clients",
      value: String(ordersCount),
      subtitle: "dans le carnet",
      icon: PackageSearch,
      color: "var(--card-accent-coral)",
    },
    {
      title: "Ventes",
      value: formatCurrency(salesTotalChf),
      subtitle: "35 CHF sweat / 15 CHF gourde",
      icon: Banknote,
      color: "var(--card-accent-mint)",
    },
    {
      title: "Membres actifs",
      value: String(memberCount),
      subtitle: "membres",
      icon: Users,
      color: "var(--card-accent-purple)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} accentColor={card.color}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="text-2xl font-black mt-1 font-mono">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs font-bold text-[var(--text-muted)] mt-1">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div
                  className="p-2 rounded-[var(--radius-element)] border-2 border-[var(--border-color)]"
                  style={{ backgroundColor: card.color }}
                >
                  <Icon className="h-5 w-5 text-black" strokeWidth={3} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
