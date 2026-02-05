"use client";

import { useMemo, useCallback } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { CALENDAR_MESSAGES } from "@/lib/constants";
import type { CalendarEvent } from "@/types";

const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (slotInfo: { start: Date; end: Date }) => void;
}

interface CalendarItem {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CalendarEvent;
}

export function CalendarView({
  events,
  onEventClick,
  onSlotClick,
}: CalendarViewProps) {
  const calendarEvents: CalendarItem[] = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_date),
        end: new Date(event.end_date),
        resource: event,
      })),
    [events]
  );

  const eventStyleGetter = useCallback(
    (event: CalendarItem) => ({
      style: {
        backgroundColor: event.resource.color,
        color: "#000",
        border: "2px solid var(--border-color)",
        borderRadius: "4px",
        fontWeight: 700,
      },
    }),
    []
  );

  return (
    <div className="h-[600px]">
      <Calendar<CalendarItem>
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        culture="fr"
        messages={CALENDAR_MESSAGES}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={(event) => onEventClick(event.resource)}
        onSelectSlot={(slotInfo) =>
          onSlotClick({ start: slotInfo.start, end: slotInfo.end })
        }
        selectable
        views={["month", "week", "agenda"] as View[]}
        defaultView="month"
        popup
      />
    </div>
  );
}
