"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersForm } from "@/components/orders/orders-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { summarizeOrdersSales } from "@/lib/orders";
import { formatCurrency } from "@/lib/utils";
import type { CustomerOrderFormData } from "@/lib/validations";

export default function OrdersPage() {
  const { isCommitteeMember } = useAuth();
  const { orders, loading, upsertOrder } = useOrders();
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

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

  const handleCreateOrder = async (data: CustomerOrderFormData) => {
    setFormLoading(true);
    const { error } = await upsertOrder(data);
    if (error) {
      toast.error("Impossible d'enregistrer la commande");
    } else {
      toast.success("Commande enregistrée. Ajoutée en haut de la liste.");
      setFormOpen(false);
    }
    setFormLoading(false);
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
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={3} />
          Ajouter une commande
        </Button>
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

      <OrdersTable orders={orders} />

      <OrdersForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateOrder}
        loading={formLoading}
      />
    </div>
  );
}
