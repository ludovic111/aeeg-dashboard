"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesEntry } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  entries: SalesEntry[];
}

export function SalesChart({ entries }: SalesChartProps) {
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};

    entries.forEach((entry) => {
      const day = format(new Date(entry.date), "dd/MM", { locale: fr });
      grouped[day] = (grouped[day] || 0) + Number(entry.revenue);
    });

    const sortedKeys = Object.keys(grouped).slice(-30);

    return {
      labels: sortedKeys,
      datasets: [
        {
          label: "Revenus (CHF)",
          data: sortedKeys.map((k) => grouped[k]),
          borderColor: "#4ECDC4",
          backgroundColor: "rgba(78, 205, 196, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#4ECDC4",
          pointBorderColor: "#000",
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [entries]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#000",
        borderWidth: 2,
        cornerRadius: 8,
        titleFont: { weight: 900 as const, family: "Inter" },
        bodyFont: { weight: 700 as const, family: "JetBrains Mono" },
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,0,0,0.1)" },
        ticks: { font: { weight: 700 as const, family: "Inter" } },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.1)" },
        ticks: {
          font: { weight: 700 as const, family: "JetBrains Mono" },
          callback: (value: string | number) => `${value} CHF`,
        },
      },
    },
  };

  return (
    <Card accentColor="#4ECDC4">
      <CardHeader>
        <CardTitle className="text-base">📈 Évolution des ventes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
