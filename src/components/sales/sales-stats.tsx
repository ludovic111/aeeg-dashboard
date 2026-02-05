"use client";

import { TrendingUp, ShoppingCart, Calculator } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { SalesStats } from "@/types";

interface SalesStatsProps {
  stats: SalesStats;
}

export function SalesStatsCards({ stats }: SalesStatsProps) {
  const items = [
    {
      title: "Total des ventes",
      value: formatCurrency(stats.totalRevenue),
      icon: TrendingUp,
      color: "#4ECDC4",
    },
    {
      title: "Nombre de commandes",
      value: String(stats.orderCount),
      icon: ShoppingCart,
      color: "#FFE66D",
    },
    {
      title: "Panier moyen",
      value: formatCurrency(stats.averageOrder),
      icon: Calculator,
      color: "#AA96DA",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.title} accentColor={item.color}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-[var(--foreground)]/60 uppercase tracking-wide">
                    {item.title}
                  </p>
                  <p className="text-2xl font-black mt-1 font-mono">
                    {item.value}
                  </p>
                </div>
                <div
                  className="p-2 rounded-lg border-2 border-[var(--border-color)]"
                  style={{ backgroundColor: item.color }}
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
