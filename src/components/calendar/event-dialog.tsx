"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { eventSchema, type EventFormData } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES, COLOR_OPTIONS } from "@/lib/constants";
import type { CalendarEvent, EventType } from "@/types";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  defaultDates?: { start: string; end: string };
  onSubmit: (data: EventFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  loading?: boolean;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  defaultDates,
  onSubmit,
  onDelete,
  loading,
}: EventDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || "",
      type: event?.type || "event",
      start_date: event?.start_date
        ? new Date(event.start_date).toISOString().slice(0, 16)
        : defaultDates?.start || "",
      end_date: event?.end_date
        ? new Date(event.end_date).toISOString().slice(0, 16)
        : defaultDates?.end || "",
      description: event?.description || "",
      location: event?.location || "",
      color: event?.color || "#4ECDC4",
    },
  });

  const typeValue = useWatch({ control, name: "type" }) || "event";
  const colorValue = useWatch({ control, name: "color" }) || "#4ECDC4";

  const handleFormSubmit = async (data: EventFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {event ? "Modifier l'événement" : "Nouvel événement"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Titre *</Label>
            <Input
              id="event-title"
              placeholder="Nom de l'événement"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm font-bold text-brutal-red">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={typeValue}
                onValueChange={(v) => setValue("type", v as EventType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.icon} {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <Select
                value={colorValue}
                onValueChange={(v) => setValue("color", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full border-2 border-[var(--border-color)]"
                          style={{ backgroundColor: c.value }}
                        />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Début *</Label>
              <Input
                id="start-date"
                type="datetime-local"
                {...register("start_date")}
              />
              {errors.start_date && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Fin *</Label>
              <Input
                id="end-date"
                type="datetime-local"
                {...register("end_date")}
              />
              {errors.end_date && (
                <p className="text-sm font-bold text-brutal-red">
                  {errors.end_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-location">Lieu</Label>
            <Input
              id="event-location"
              placeholder="Lieu de l'événement"
              {...register("location")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-desc">Description</Label>
            <Textarea
              id="event-desc"
              placeholder="Détails..."
              rows={3}
              {...register("description")}
            />
          </div>

          <DialogFooter>
            {event && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDelete(event.id)}
              >
                <Trash2 className="h-4 w-4" strokeWidth={3} />
                Supprimer
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading
                ? "Enregistrement..."
                : event
                ? "Mettre à jour"
                : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
