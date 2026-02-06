"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import dynamic from "next/dynamic";
import { meetingSchema, type MeetingFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Meeting } from "@/types";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className="brutal-skeleton h-48" />,
});

interface MeetingFormProps {
  meeting?: Meeting;
  onSubmit: (data: MeetingFormData) => Promise<void>;
  loading?: boolean;
}

export function MeetingForm({ meeting, onSubmit, loading }: MeetingFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: meeting?.title || "",
      date: meeting?.date
        ? new Date(meeting.date).toISOString().slice(0, 16)
        : "",
      location: meeting?.location || "",
      agenda: meeting?.agenda || "",
      minutes: meeting?.minutes || "",
    },
  });

  const minutes = useWatch({ control, name: "minutes" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Titre *</Label>
        <Input id="title" placeholder="Titre de la réunion" {...register("title")} />
        {errors.title && (
          <p className="text-sm font-bold text-[var(--accent-orange)]">{errors.title.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date et heure *</Label>
          <Input id="date" type="datetime-local" {...register("date")} />
          {errors.date && (
            <p className="text-sm font-bold text-[var(--accent-orange)]">{errors.date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Lieu</Label>
          <Input id="location" placeholder="Salle, en ligne..." {...register("location")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agenda">Ordre du jour</Label>
        <Textarea
          id="agenda"
          placeholder="Points à discuter..."
          rows={4}
          {...register("agenda")}
        />
      </div>

      <div className="space-y-2">
        <Label>Procès-verbal (Markdown)</Label>
        <div data-color-mode="light">
          <MDEditor
            value={minutes || ""}
            onChange={(val) => setValue("minutes", val || "")}
            height={300}
            preview="edit"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Enregistrement..."
            : meeting
            ? "Mettre à jour"
            : "Créer la réunion"}
        </Button>
      </div>
    </form>
  );
}
