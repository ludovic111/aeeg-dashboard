"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  customerOrderSchema,
  type CustomerOrderFormData,
} from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrdersFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CustomerOrderFormData) => Promise<void>;
  loading?: boolean;
}

export function OrdersForm({
  open,
  onOpenChange,
  onSubmit,
  loading,
}: OrdersFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerOrderFormData>({
    resolver: zodResolver(customerOrderSchema),
    defaultValues: {
      order_number: "",
      full_name: "",
      email: "",
      order_details: "",
    },
  });

  const handleFormSubmit = async (data: CustomerOrderFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🧾 Ajouter une commande</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order_number">N° commande *</Label>
              <Input
                id="order_number"
                placeholder="#1031"
                {...register("order_number")}
              />
              {errors.order_number && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.order_number.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nom complet *</Label>
              <Input
                id="full_name"
                placeholder="Prénom Nom"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.full_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm font-bold text-brutal-red">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_details">Commande *</Label>
            <Textarea
              id="order_details"
              rows={3}
              placeholder="1x Sweat Emilie Gourd - Bleu Marine - M"
              {...register("order_details")}
            />
            {errors.order_details && (
              <p className="text-sm font-bold text-brutal-red">
                {errors.order_details.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Ajouter la commande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
