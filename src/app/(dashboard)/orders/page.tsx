"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { OrdersTable } from "@/components/orders/orders-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatOrderItem,
  parseLegacyOrderDetails,
  summarizeOrderSales,
  summarizeOrdersSales,
} from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";
import type { CustomerOrderFormData } from "@/lib/validations";
import type { CustomerOrder } from "@/types";

const OrdersForm = dynamic(
  () =>
    import("@/components/orders/orders-form").then(
      (module) => module.OrdersForm
    ),
  {
    loading: () => <Skeleton className="h-[520px]" />,
  }
);

export default function OrdersPage() {
  const { isCommitteeMember } = useAuth();
  const { orders, loading, saveOrder } = useOrders();
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);

  const emailCoverage = useMemo(() => {
    if (orders.length === 0) return 0;
    const withEmail = orders.filter((order) => Boolean(order.email)).length;
    return Math.round((withEmail / orders.length) * 100);
  }, [orders]);

  const salesSummary = useMemo(() => summarizeOrdersSales(orders), [orders]);

  if (!isCommitteeMember) {
    return (
      <div className="text-center py-16">
        <p className="text-5xl mb-4">🔒</p>
        <p className="font-black text-lg">Accès restreint</p>
        <p className="text-sm text-[var(--foreground)]/60 font-bold mt-1">
          Seuls les membres du comité et les admins peuvent accéder à cette page
        </p>
      </div>
    );
  }

  const handleSaveOrder = async (data: CustomerOrderFormData) => {
    setFormLoading(true);
    const { error } = await saveOrder({
      ...data,
      id: editingOrder?.id,
    });
    if (error) {
      toast.error("Impossible d'enregistrer la commande");
      setFormLoading(false);
      return false;
    } else {
      toast.success(
        editingOrder
          ? "Commande modifiée."
          : "Commande enregistrée. Ajoutée en haut de la liste."
      );
      setFormOpen(false);
      setEditingOrder(null);
    }
    setFormLoading(false);
    return true;
  };

  const handleOpenCreate = () => {
    setEditingOrder(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (order: CustomerOrder) => {
    setEditingOrder(order);
    setFormOpen(true);
  };

  const handleExportCsv = () => {
    if (orders.length === 0) {
      toast.error("Aucune commande à exporter");
      return;
    }

    setExporting(true);

    try {
      const separator = ";";
      const escapeCell = (value: string) => {
        const normalized = value.replace(/\r?\n/g, " ").trim();
        if (
          normalized.includes('"') ||
          normalized.includes(separator) ||
          normalized.includes("|")
        ) {
          return `"${normalized.replace(/"/g, '""')}"`;
        }
        return normalized;
      };

      const header = [
        "Numero",
        "Nom complet",
        "Email",
        "Commande",
        "Sweats",
        "Gourdes",
        "Ventes CHF",
        "Importe le",
      ];

      const rows = orders.map((order) => {
        const items =
          order.order_items?.length > 0
            ? order.order_items
            : parseLegacyOrderDetails(order.order_details);
        const itemsLabel =
          items.length > 0
            ? items.map((item) => formatOrderItem(item)).join(" | ")
            : order.order_details;
        const orderSummary = summarizeOrderSales(order);
        return [
          order.order_number,
          order.full_name,
          order.email || "",
          itemsLabel,
          String(orderSummary.sweatCount),
          String(orderSummary.gourdeCount),
          orderSummary.totalRevenueChf.toFixed(2),
          new Date(order.imported_at).toISOString(),
        ]
          .map((cell) => escapeCell(cell))
          .join(separator);
      });

      const csvContent = `\uFEFF${[header.join(separator), ...rows].join("\n")}`;
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `commandes_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast.success("Export CSV prêt");
    } catch {
      toast.error("Impossible d'exporter les commandes");
    } finally {
      setExporting(false);
    }
  };

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingOrder(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-52" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[440px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">📦 Commandes clients</h1>
          <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
            Les nouvelles commandes apparaissent en haut automatiquement
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={exporting}>
            <Download className="h-4 w-4" strokeWidth={3} />
            {exporting ? "Export..." : "Exporter CSV"}
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" strokeWidth={3} />
            Ajouter une commande
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
              Total commandes
            </p>
            <p className="text-3xl font-black mt-1">{orders.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
              Ventes totales
            </p>
            <p className="text-3xl font-black mt-1">{formatCurrency(salesSummary.totalRevenueChf)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
              Sweats vendus
            </p>
            <p className="text-3xl font-black mt-1">{salesSummary.sweatCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
              Gourdes vendues
            </p>
            <p className="text-3xl font-black mt-1">{salesSummary.gourdeCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-black uppercase tracking-wide text-[var(--foreground)]/60">
              Couverture email
            </p>
            <p className="text-3xl font-black mt-1">{emailCoverage}%</p>
          </CardContent>
        </Card>
      </div>

      <OrdersTable orders={orders} onEdit={handleOpenEdit} />

      {formOpen && (
        <OrdersForm
          open={formOpen}
          onOpenChange={handleFormOpenChange}
          onSubmit={handleSaveOrder}
          initialOrder={editingOrder}
          loading={formLoading}
        />
      )}
    </div>
  );
}
