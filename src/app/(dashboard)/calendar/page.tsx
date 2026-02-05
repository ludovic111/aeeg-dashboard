"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CalendarView } from "@/components/calendar/calendar-view";
import { EventDialog } from "@/components/calendar/event-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CalendarEvent } from "@/types";
import type { EventFormData } from "@/lib/validations";

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [defaultDates, setDefaultDates] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [mutating, setMutating] = useState(false);
  const { isAdmin, isCommitteeMember } = useAuth();
  const supabase = createClient();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: true });
    setEvents((data as CalendarEvent[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("events-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => fetchEvents()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchEvents]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDefaultDates(null);
    setDialogOpen(true);
  };

  const handleSlotClick = (slotInfo: { start: Date; end: Date }) => {
    if (!isCommitteeMember) return;
    setSelectedEvent(null);
    setDefaultDates({
      start: slotInfo.start.toISOString().slice(0, 16),
      end: slotInfo.end.toISOString().slice(0, 16),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: EventFormData) => {
    setMutating(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = {
      title: data.title,
      type: data.type,
      start_date: new Date(data.start_date).toISOString(),
      end_date: new Date(data.end_date).toISOString(),
      description: data.description || null,
      location: data.location || null,
      color: data.color,
    };

    if (selectedEvent) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", selectedEvent.id);
      if (error) toast.error("Erreur lors de la mise à jour");
      else toast.success("Événement mis à jour !");
    } else {
      const { error } = await supabase.from("events").insert({
        ...payload,
        created_by: user?.id,
      });
      if (error) toast.error("Erreur lors de la création");
      else toast.success("Événement créé !");
    }

    setMutating(false);
    setDialogOpen(false);
    fetchEvents();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cet événement ?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error("Erreur lors de la suppression");
    else toast.success("Événement supprimé");
    setDialogOpen(false);
    fetchEvents();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[600px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">📅 Calendrier partagé</h1>
          <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
            Événements, réunions et échéances
          </p>
        </div>
        {isCommitteeMember && (
          <Button
            onClick={() => {
              setSelectedEvent(null);
              setDefaultDates(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            Nouvel événement
          </Button>
        )}
      </div>

      <CalendarView
        events={events}
        onEventClick={handleEventClick}
        onSlotClick={handleSlotClick}
      />

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        defaultDates={defaultDates || undefined}
        onSubmit={handleSubmit}
        onDelete={isAdmin ? handleDelete : undefined}
        loading={mutating}
      />
    </div>
  );
}
