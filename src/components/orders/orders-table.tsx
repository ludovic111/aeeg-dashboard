"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelative } from "@/lib/utils";
import {
  formatOrderItem,
  parseLegacyOrderDetails,
  summarizeOrderSales,
} from "@/lib/orders";
import type { CustomerOrder } from "@/types";
import { Pencil } from "lucide-react";

interface OrdersTableProps {
  orders: CustomerOrder[];
  onEdit?: (order: CustomerOrder) => void;
}

export function OrdersTable({ orders, onEdit }: OrdersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Commandes clients</CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-0">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-sm font-bold text-[var(--foreground)]/40">
            Aucune commande
          </div>
        ) : (
          <div className="space-y-3 md:hidden">
            {orders.map((order) => {
              const items =
                order.order_items?.length > 0
                  ? order.order_items
                  : parseLegacyOrderDetails(order.order_details);
              const orderRevenue = summarizeOrderSales(order).totalRevenueChf;

              return (
                <div
                  key={order.id}
                  className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black truncate">{order.full_name}</p>
                      <p className="text-xs font-mono text-[var(--foreground)]/70">
                        #{order.order_number}
                      </p>
                    </div>
                    <Badge variant="info">{formatRelative(order.imported_at)}</Badge>
                  </div>
                  <p className="text-xs font-mono text-[var(--foreground)]/70 break-words">
                    {order.email || "Sans email"}
                  </p>
                  <div className="space-y-1 text-sm">
                    {items.length > 0 ? (
                      items.map((item, itemIndex) => (
                        <p key={`${order.id}-${itemIndex}`}>{formatOrderItem(item)}</p>
                      ))
                    ) : (
                      <p>{order.order_details}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-black">{formatCurrency(orderRevenue)}</p>
                    {onEdit && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(order)}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={3} />
                        Modifier
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="hidden md:block overflow-x-auto">
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
                  Vente
                </th>
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  Ajout
                </th>
                <th className="text-left p-3 text-xs font-black uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order, index) => {
                const items =
                  order.order_items?.length > 0
                    ? order.order_items
                    : parseLegacyOrderDetails(order.order_details);
                const orderRevenue = summarizeOrderSales(order).totalRevenueChf;

                return (
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
                    <td className="p-3 text-sm">
                      <div className="space-y-1">
                        {items.length > 0 ? (
                          items.map((item, itemIndex) => (
                            <p key={`${order.id}-${itemIndex}`}>
                              {formatOrderItem(item)}
                            </p>
                          ))
                        ) : (
                          <p>{order.order_details}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-sm font-bold">
                      {formatCurrency(orderRevenue)}
                    </td>
                    <td className="p-3 text-sm">
                      <Badge variant="info">{formatRelative(order.imported_at)}</Badge>
                    </td>
                    <td className="p-3 text-sm">
                      {onEdit && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(order)}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={3} />
                          Modifier
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
