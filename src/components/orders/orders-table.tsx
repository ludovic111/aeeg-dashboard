"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils";
import type { CustomerOrder } from "@/types";

interface OrdersTableProps {
  orders: CustomerOrder[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">📦 Commandes clients</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[var(--border-color)]">
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  N°
                </th>
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  Nom
                </th>
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  Email
                </th>
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  Commande
                </th>
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  Ajout
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-sm font-bold text-[var(--foreground)]/40"
                  >
                    Aucune commande
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`border-b border-[var(--border-color)]/20 ${
                      index % 2 === 0 ? "" : "bg-[var(--background)]"
                    }`}
                  >
                    <td className="p-3 text-sm font-mono font-bold">
                      {order.order_number}
                    </td>
                    <td className="p-3 text-sm font-bold">{order.full_name}</td>
                    <td className="p-3 text-sm font-mono">
                      {order.email || (
                        <span className="text-[var(--foreground)]/50">-</span>
                      )}
                    </td>
                    <td className="p-3 text-sm">{order.order_details}</td>
                    <td className="p-3 text-sm">
                      <Badge variant="info">{formatRelative(order.imported_at)}</Badge>
                    </td>
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
