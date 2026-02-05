"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AdminPanel } from "@/components/dashboard/admin-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

interface DashboardData {
  nextMeeting: { title: string; date: string } | null;
  taskCount: number;
  monthlyRevenue: number;
  memberCount: number;
  activities: Array<{
    id: string;
    type: "meeting" | "task" | "sale" | "member";
    description: string;
    user_name: string;
    user_avatar?: string | null;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      const now = new Date().toISOString();
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      const [meetingsRes, tasksRes, salesRes, membersRes] = await Promise.all([
        supabase
          .from("meetings")
          .select("title, date")
          .gte("date", now)
          .order("date", { ascending: true })
          .limit(1),
        supabase
          .from("tasks")
          .select("id")
          .in("status", ["todo", "in_progress"]),
        supabase
          .from("sales_entries")
          .select("revenue")
          .gte("date", startOfMonth),
        supabase.from("profiles").select("id"),
      ]);

      const nextMeeting = meetingsRes.data?.[0] || null;
      const taskCount = tasksRes.data?.length || 0;
      const monthlyRevenue =
        salesRes.data?.reduce(
          (sum, entry) => sum + Number(entry.revenue),
          0
        ) || 0;
      const memberCount = membersRes.data?.length || 0;

      // Build activity feed from recent changes
      const [recentMeetings, recentTasks] = await Promise.all([
        supabase
          .from("meetings")
          .select("id, title, created_at, created_by, profiles!meetings_created_by_fkey(full_name, avatar_url)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("tasks")
          .select("id, title, status, created_at, created_by, profiles!tasks_created_by_fkey(full_name, avatar_url)")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      type ProfileJoin = { full_name: string; avatar_url: string | null };

      const activities = [
        ...(recentMeetings.data || []).map((m) => {
          const profile = m.profiles as unknown as ProfileJoin | null;
          return {
            id: m.id,
            type: "meeting" as const,
            description: `Réunion créée : ${m.title}`,
            user_name: profile?.full_name || "Inconnu",
            user_avatar: profile?.avatar_url,
            created_at: m.created_at,
          };
        }),
        ...(recentTasks.data || []).map((t) => {
          const profile = t.profiles as unknown as ProfileJoin | null;
          return {
            id: t.id,
            type: "task" as const,
            description: `Tâche créée : ${t.title}`,
            user_name: profile?.full_name || "Inconnu",
            user_avatar: profile?.avatar_url,
            created_at: t.created_at,
          };
        }),
      ]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 10);

      setData({
        nextMeeting,
        taskCount,
        monthlyRevenue,
        memberCount,
        activities,
      });
      setLoading(false);
    }

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">🏠 Tableau de bord</h1>
        <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
          Bienvenue sur le dashboard de l&apos;AEEG
        </p>
      </div>

      {isSuperAdmin && (
        <>
          <AdminPanel />
          <Separator />
        </>
      )}

      <OverviewCards
        nextMeeting={data?.nextMeeting || null}
        taskCount={data?.taskCount || 0}
        monthlyRevenue={data?.monthlyRevenue || 0}
        memberCount={data?.memberCount || 0}
      />

      <QuickActions />

      <ActivityFeed activities={data?.activities || []} />
    </div>
  );
}
