"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { salesEntrySchema, type SalesEntryFormData } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SalesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SalesEntryFormData) => Promise<void>;
  loading?: boolean;
}

export function SalesForm({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: SalesFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalesEntryFormData>({
    resolver: zodResolver(salesEntrySchema),
    defaultValues: {
      product_name: "",
      quantity: 1,
      revenue: 0,
      date: new Date().toISOString().slice(0, 16),
    },
  });

  const handleFormSubmit = async (data: SalesEntryFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🛍️ Ajouter une vente manuellement</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="product_name">Nom du produit *</Label>
            <Input
              id="product_name"
              placeholder="T-shirt AEEG, Sticker..."
              {...register("product_name")}
            />
            {errors.product_name && (
              <p className="text-sm font-bold text-brutal-red">
                {errors.product_name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantité *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                {...register("quantity", { valueAsNumber: true })}
              />
              {errors.quantity && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue">Revenu (CHF) *</Label>
              <Input
                id="revenue"
                type="number"
                step="0.01"
                min={0}
                {...register("revenue", { valueAsNumber: true })}
              />
              {errors.revenue && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.revenue.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sale-date">Date *</Label>
            <Input
              id="sale-date"
              type="datetime-local"
              {...register("date")}
            />
            {errors.date && (
              <p className="text-sm font-bold text-brutal-red">
                {errors.date.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Ajouter la vente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
