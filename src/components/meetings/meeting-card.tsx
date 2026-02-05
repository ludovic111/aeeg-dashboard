"use client";

import Link from "next/link";
import { MapPin, Clock, ListChecks } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime } from "@/lib/utils";
import type { Meeting } from "@/types";

interface MeetingCardProps {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const isPast = new Date(meeting.date) < new Date();

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <Card
        accentColor={isPast ? "#95E1D3" : "#4ECDC4"}
        accentPosition="left"
        className="hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all cursor-pointer"
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-black text-base truncate pr-2">
              {meeting.title}
            </h3>
            <Badge variant={isPast ? "default" : "info"}>
              {isPast ? "Passée" : "À venir"}
            </Badge>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-[var(--foreground)]/70">
              <Clock className="h-3.5 w-3.5" strokeWidth={3} />
              <span className="font-mono">
                {formatDate(meeting.date)} · {formatTime(meeting.date)}
              </span>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2 text-[var(--foreground)]/70">
                <MapPin className="h-3.5 w-3.5" strokeWidth={3} />
                <span className="font-bold">{meeting.location}</span>
              </div>
            )}
            {meeting.action_items && meeting.action_items.length > 0 && (
              <div className="flex items-center gap-2 text-[var(--foreground)]/70">
                <ListChecks className="h-3.5 w-3.5" strokeWidth={3} />
                <span className="font-bold">
                  {meeting.action_items.length} actions
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
