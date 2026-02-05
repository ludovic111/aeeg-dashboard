"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { useMeetings } from "@/hooks/use-meetings";
import { MeetingCard } from "@/components/meetings/meeting-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function MeetingsPage() {
  const { meetings, loading } = useMeetings();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return meetings
      .filter((m) => {
        return (
          !search ||
          m.title.toLowerCase().includes(search.toLowerCase()) ||
          m.location?.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [meetings, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">📋 Réunions</h1>
          <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
            Planifier une date et consulter l&apos;ordre du jour (PDF)
          </p>
        </div>
        <Link href="/meetings/new">
          <Button>
            <Plus className="h-4 w-4" strokeWidth={3} />
            Nouvelle réunion
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/40" strokeWidth={3} />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📭</p>
          <p className="font-black text-lg">Aucune réunion trouvée</p>
          <p className="text-sm text-[var(--foreground)]/60 font-bold mt-1">
            Essayez un autre terme de recherche.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
