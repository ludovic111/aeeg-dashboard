"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatShortDate, formatCurrency } from "@/lib/utils";
import type { SalesEntry } from "@/types";

interface SalesTableProps {
  entries: SalesEntry[];
  canDelete: boolean;
  onDelete: (id: string) => void;
}

export function SalesTable({ entries, canDelete, onDelete }: SalesTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">🧾 Détail des ventes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[var(--border-color)]">
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  Date
                </th>
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  Produit
                </th>
                <th className="text-right p-3 text-xs font-black uppercase tracking-wide">
                  Qté
                </th>
                <th className="text-right p-3 text-xs font-black uppercase tracking-wide">
                  Revenu
                </th>
                <th className="text-center p-3 text-xs font-black uppercase tracking-wide">
                  Source
                </th>
                {canDelete && (
                  <th className="p-3 text-xs font-black uppercase tracking-wide w-10" />
                )}
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={canDelete ? 6 : 5}
                    className="p-8 text-center text-sm font-bold text-[var(--foreground)]/40"
                  >
                    Aucune vente enregistrée
                  </td>
                </tr>
              ) : (
                entries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={`border-b border-[var(--border-color)]/20 ${
                      i % 2 === 0 ? "" : "bg-[var(--background)]"
                    }`}
                  >
                    <td className="p-3 text-sm font-mono">
                      {formatShortDate(entry.date)}
                    </td>
                    <td className="p-3 text-sm font-bold">
                      {entry.product_name}
                    </td>
                    <td className="p-3 text-sm font-mono text-right">
                      {entry.quantity}
                    </td>
                    <td className="p-3 text-sm font-mono text-right font-bold">
                      {formatCurrency(Number(entry.revenue))}
                    </td>
                    <td className="p-3 text-center">
                      <Badge variant="purple">
                        {entry.source === "manual" ? "Manuel" : "Importé"}
                      </Badge>
                    </td>
                    {canDelete && (
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(entry.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={3} />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
