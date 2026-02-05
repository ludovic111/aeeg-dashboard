"use client";

import { CalendarDays, CheckSquare, PackageSearch, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface OverviewCardsProps {
  nextMeeting: { title: string; date: string } | null;
  taskCount: number;
  ordersCount: number;
  memberCount: number;
}

export function OverviewCards({
  nextMeeting,
  taskCount,
  ordersCount,
  memberCount,
}: OverviewCardsProps) {
  const cards = [
    {
      title: "Prochaine réunion",
      value: nextMeeting ? nextMeeting.title : "Aucune",
      subtitle: nextMeeting ? formatDate(nextMeeting.date) : "",
      icon: CalendarDays,
      color: "#4ECDC4",
    },
    {
      title: "Tâches en cours",
      value: String(taskCount),
      subtitle: "tâches actives",
      icon: CheckSquare,
      color: "#FFE66D",
    },
    {
      title: "Commandes clients",
      value: String(ordersCount),
      subtitle: "dans le carnet",
      icon: PackageSearch,
      color: "#F38181",
    },
    {
      title: "Membres actifs",
      value: String(memberCount),
      subtitle: "membres",
      icon: Users,
      color: "#AA96DA",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} accentColor={card.color}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]/60 uppercase tracking-wide">
                    {card.title}
                  </p>
                  <p className="text-2xl font-black mt-1 font-mono">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs font-bold text-[var(--foreground)]/50 mt-1">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div
                  className="p-2 rounded-lg border-2 border-[var(--border-color)]"
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
