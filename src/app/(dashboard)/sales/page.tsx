"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSales, useSalesMutations } from "@/hooks/use-sales";
import { SalesStatsCards } from "@/components/sales/sales-stats";
import { SalesChart } from "@/components/sales/sales-chart";
import { SalesTable } from "@/components/sales/sales-table";
import { SalesForm } from "@/components/sales/sales-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { SalesEntryFormData } from "@/lib/validations";

export default function SalesPage() {
  const { isAdmin, isCommitteeMember } = useAuth();
  const { entries, stats, loading, refetch } = useSales();
  const { createSale, deleteSale } = useSalesMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

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

  const handleCreateSale = async (data: SalesEntryFormData) => {
    setFormLoading(true);
    const { error } = await createSale({
      product_name: data.product_name,
      quantity: data.quantity,
      revenue: data.revenue,
      date: new Date(data.date).toISOString(),
    });
    if (error) {
      toast.error("Erreur lors de l'ajout de la vente");
    } else {
      toast.success("Vente ajoutée !");
      setFormOpen(false);
      refetch();
    }
    setFormLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette vente ?")) return;
    const { error } = await deleteSale(id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Vente supprimée");
      refetch();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">🛍️ Suivi des ventes</h1>
          <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
            Ventes de merch
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={3} />
          Ajouter une vente
        </Button>
      </div>

      <SalesStatsCards stats={stats} />
      <SalesChart entries={entries} />
      <SalesTable
        entries={entries}
        canDelete={isAdmin}
        onDelete={handleDelete}
      />

      <SalesForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateSale}
        loading={formLoading}
      />
    </div>
  );
}
