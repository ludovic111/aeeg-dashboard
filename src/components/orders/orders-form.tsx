"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  customerOrderSchema,
  type CustomerOrderFormData,
} from "@/lib/validations";
import {
  ORDER_PRODUCT_LABELS,
  SWEAT_COLOR_LABELS,
  SWEAT_SIZE_LABELS,
} from "@/lib/orders";
import type { OrderProduct, SweatColor, SweatSize } from "@/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    control,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerOrderFormData>({
    resolver: zodResolver(customerOrderSchema),
    defaultValues: {
      order_number: "",
      full_name: "",
      email: "",
      order_items: [
        {
          product: "emilie_gourde",
          quantity: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "order_items",
  });

  const orderItems = useWatch({ control, name: "order_items" });

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

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Articles *</Label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() =>
                  append({
                    product: "emilie_gourde",
                    quantity: 1,
                  })
                }
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
                Ajouter un article
              </Button>
            </div>

            {fields.map((field, index) => {
              const currentProduct =
                orderItems?.[index]?.product || "emilie_gourde";

              return (
                <div
                  key={field.id}
                  className="rounded-lg border-2 border-[var(--border-color)] p-3 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_0.8fr_auto] gap-3 items-end">
                    <div className="space-y-2">
                      <Label>Produit</Label>
                      <Select
                        value={currentProduct}
                        onValueChange={(value) => {
                          const product = value as OrderProduct;
                          setValue(`order_items.${index}.product`, product, {
                            shouldValidate: true,
                          });

                          if (product === "sweat_emilie_gourd") {
                            setValue(
                              `order_items.${index}.color`,
                              (orderItems?.[index]?.color || "gris") as SweatColor,
                              { shouldValidate: true }
                            );
                            setValue(
                              `order_items.${index}.size`,
                              (orderItems?.[index]?.size || "m") as SweatSize,
                              { shouldValidate: true }
                            );
                          } else {
                            setValue(`order_items.${index}.color`, undefined, {
                              shouldValidate: true,
                            });
                            setValue(`order_items.${index}.size`, undefined, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ORDER_PRODUCT_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${field.id}`}>Quantité</Label>
                      <Input
                        id={`quantity-${field.id}`}
                        type="number"
                        min={1}
                        {...register(`order_items.${index}.quantity`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={3} />
                    </Button>
                  </div>

                  {currentProduct === "sweat_emilie_gourd" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Couleur</Label>
                        <Select
                          value={orderItems?.[index]?.color || "gris"}
                          onValueChange={(value) =>
                            setValue(
                              `order_items.${index}.color`,
                              value as SweatColor,
                              { shouldValidate: true }
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SWEAT_COLOR_LABELS).map(
                              ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Taille</Label>
                        <Select
                          value={orderItems?.[index]?.size || "m"}
                          onValueChange={(value) =>
                            setValue(`order_items.${index}.size`, value as SweatSize, {
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SWEAT_SIZE_LABELS).map(
                              ([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {(errors.order_items?.[index]?.quantity ||
                    errors.order_items?.[index]?.color ||
                    errors.order_items?.[index]?.size) && (
                    <p className="text-sm font-bold text-brutal-red">
                      {errors.order_items?.[index]?.quantity?.message ||
                        errors.order_items?.[index]?.color?.message ||
                        errors.order_items?.[index]?.size?.message}
                    </p>
                  )}
                </div>
              );
            })}

            {errors.order_items && !Array.isArray(errors.order_items) && (
              <p className="text-sm font-bold text-brutal-red">
                {errors.order_items.message}
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
