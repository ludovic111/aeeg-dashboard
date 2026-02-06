"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  ClipboardCheck,
  ListTodo,
  PackageSearch,
  Vote,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { summarizeOrdersSales } from "@/lib/orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { CustomerOrder } from "@/types";

interface DashboardData {
  openTaskCount: number;
  overdueTaskCount: number;
  tasksDueSoonCount: number;
  ordersCount: number;
  ordersThisWeekCount: number;
  salesTotalChf: number;
  openPollCount: number;
  upcomingSoireeCount: number;
  meetingsCount: number;
  meetingsWithSummaryCount: number;
  memberCount: number;
  activities: Array<{
    id: string;
    type: "meeting" | "task" | "sale" | "member";
    description: string;
    user_name: string;
    user_avatar?: string | null;
    created_at: string;
  }>;
  upcoming: Array<{
    id: string;
    type: "task" | "meeting" | "soiree";
    title: string;
    date: string;
    subtitle: string;
  }>;
}

const QuickActions = dynamic(
  () =>
    import("@/components/dashboard/quick-actions").then(
      (module) => module.QuickActions
    ),
  {
    loading: () => <Skeleton className="h-24" />,
  }
);

const AdminPanel = dynamic(
  () =>
    import("@/components/dashboard/admin-panel").then(
      (module) => module.AdminPanel
    ),
  {
    loading: () => <Skeleton className="h-[340px]" />,
  }
);

const ActivityFeed = dynamic(
  () =>
    import("@/components/dashboard/activity-feed").then(
      (module) => module.ActivityFeed
    ),
  {
    loading: () => (
      <Card accentColor="var(--card-accent-mint)">
        <CardHeader>
          <CardTitle className="text-base">Activite recente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </CardContent>
      </Card>
    ),
  }
);

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isSuperAdmin } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      const now = new Date();
      const inSevenDays = new Date(now);
      inSevenDays.setDate(inSevenDays.getDate() + 7);
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const [
        tasksMetricsRes,
        tasksActivityRes,
        ordersRes,
        membersRes,
        meetingsRes,
        pollsRes,
        soireesRes,
      ] = await Promise.all([
        supabase
          .from("tasks")
          .select("id, title, status, deadline, created_at"),
        supabase
          .from("tasks")
          .select("id, title, status, created_at, created_by, profiles!tasks_created_by_fkey(full_name, avatar_url)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("customer_orders")
          .select("id, order_number, full_name, imported_at, order_items, order_details"),
        supabase.from("profiles").select("id"),
        supabase
          .from("meetings")
          .select("id, title, date, created_at, agenda_ai_summary, created_by, profiles!meetings_created_by_fkey(full_name, avatar_url)")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("polls")
          .select("id, closes_at"),
        supabase
          .from("parties")
          .select("id, name, event_date, event_time, place"),
      ]);

      type TaskMetricRow = {
        id: string;
        title: string;
        status: "todo" | "in_progress" | "done";
        deadline: string | null;
        created_at: string;
      };
      type OrderRow = Pick<CustomerOrder, "order_items" | "order_details"> & {
        id: string;
        order_number: string;
        full_name: string;
        imported_at: string;
      };
      type MeetingRow = {
        id: string;
        title: string;
        date: string;
        created_at: string;
        agenda_ai_summary: string | null;
        profiles:
          | { full_name: string; avatar_url: string | null }
          | Array<{ full_name: string; avatar_url: string | null }>
          | null;
      };
      type PollRow = { id: string; closes_at: string | null };
      type SoireeRow = {
        id: string;
        name: string;
        event_date: string;
        event_time: string;
        place: string;
      };
      type ProfileJoin = { full_name: string; avatar_url: string | null };

      const tasks = (tasksMetricsRes.data as TaskMetricRow[]) || [];
      const orders = (ordersRes.data as OrderRow[]) || [];
      const meetings = ((meetingsRes.data as unknown as MeetingRow[]) || []).map(
        (meeting) => ({
          ...meeting,
          profiles: Array.isArray(meeting.profiles)
            ? (meeting.profiles[0] ?? null)
            : meeting.profiles,
        })
      );
      const polls = (pollsRes.data as PollRow[]) || [];
      const soirees = (soireesRes.data as SoireeRow[]) || [];

      const openTaskCount = tasks.filter((task) => task.status !== "done").length;
      const overdueTaskCount = tasks.filter(
        (task) =>
          task.status !== "done" &&
          task.deadline &&
          new Date(task.deadline).getTime() < now.getTime()
      ).length;
      const tasksDueSoonCount = tasks.filter(
        (task) =>
          task.status !== "done" &&
          task.deadline &&
          new Date(task.deadline).getTime() >= now.getTime() &&
          new Date(task.deadline).getTime() <= inSevenDays.getTime()
      ).length;
      const ordersCount = orders.length;
      const ordersThisWeekCount = orders.filter(
        (order) => new Date(order.imported_at).getTime() >= sevenDaysAgo.getTime()
      ).length;
      const salesTotalChf = summarizeOrdersSales(
        orders || []
      ).totalRevenueChf;
      const memberCount = membersRes.data?.length || 0;
      const meetingsCount = meetings.length;
      const meetingsWithSummaryCount = meetings.filter(
        (meeting) => Boolean(meeting.agenda_ai_summary?.trim())
      ).length;
      const openPollCount = polls.filter(
        (poll) => !poll.closes_at || new Date(poll.closes_at).getTime() > now.getTime()
      ).length;
      const upcomingSoireeCount = soirees.filter((soiree) => {
        const dateValue = new Date(`${soiree.event_date}T${(soiree.event_time || "00:00").slice(0, 5)}`);
        return !Number.isNaN(dateValue.getTime()) && dateValue.getTime() >= now.getTime();
      }).length;

      const activities = [
        ...meetings.slice(0, 5).map((m) => {
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
        ...((tasksActivityRes.data || []) as Array<{
          id: string;
          title: string;
          created_at: string;
          profiles: ProfileJoin | ProfileJoin[] | null;
        }>).map((t) => {
          const rawProfile = t.profiles;
          const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
          return {
            id: t.id,
            type: "task" as const,
            description: `Tâche créée : ${t.title}`,
            user_name: profile?.full_name || "Inconnu",
            user_avatar: profile?.avatar_url,
            created_at: t.created_at,
          };
        }),
        ...orders
          .slice()
          .sort(
            (a, b) =>
              new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime()
          )
          .slice(0, 4)
          .map((order) => ({
            id: order.id,
            type: "sale" as const,
            description: `Commande #${order.order_number} ajoutée`,
            user_name: order.full_name || "Client",
            user_avatar: null,
            created_at: order.imported_at,
          })),
      ]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
        .slice(0, 10);

      const upcomingTasks = tasks
        .filter(
          (task) =>
            task.status !== "done" &&
            task.deadline &&
            new Date(task.deadline).getTime() >= now.getTime()
        )
        .map((task) => ({
          id: `task-${task.id}`,
          type: "task" as const,
          title: task.title,
          date: task.deadline as string,
          subtitle: "Échéance de tâche",
        }));

      const upcomingMeetings = meetings
        .filter((meeting) => new Date(meeting.date).getTime() >= now.getTime())
        .map((meeting) => ({
          id: `meeting-${meeting.id}`,
          type: "meeting" as const,
          title: meeting.title,
          date: meeting.date,
          subtitle: "Réunion",
        }));

      const upcomingSoirees = soirees
        .map((soiree) => {
          const iso = `${soiree.event_date}T${(soiree.event_time || "00:00").slice(0, 5)}`;
          return {
            id: `soiree-${soiree.id}`,
            type: "soiree" as const,
            title: soiree.name,
            date: iso,
            subtitle: `Soirée · ${soiree.place}`,
          };
        })
        .filter((entry) => new Date(entry.date).getTime() >= now.getTime());

      const upcoming = [...upcomingTasks, ...upcomingMeetings, ...upcomingSoirees]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 10);

      setData({
        openTaskCount,
        overdueTaskCount,
        tasksDueSoonCount,
        ordersCount,
        ordersThisWeekCount,
        salesTotalChf,
        openPollCount,
        upcomingSoireeCount,
        meetingsCount,
        meetingsWithSummaryCount,
        memberCount,
        activities,
        upcoming,
      });
      setLoading(false);
    }

    fetchDashboardData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: "Tâches ouvertes",
      value: String(data?.openTaskCount || 0),
      subtitle: `${data?.tasksDueSoonCount || 0} à traiter cette semaine`,
      icon: ListTodo,
      color: "var(--card-accent-yellow)",
    },
    {
      title: "Tâches en retard",
      value: String(data?.overdueTaskCount || 0),
      subtitle: "à replanifier rapidement",
      icon: AlertTriangle,
      color: "var(--card-accent-coral)",
    },
    {
      title: "Ventes totales",
      value: formatCurrency(data?.salesTotalChf || 0),
      subtitle: `${data?.ordersCount || 0} commandes`,
      icon: Banknote,
      color: "var(--card-accent-mint)",
    },
    {
      title: "Commandes (7 jours)",
      value: String(data?.ordersThisWeekCount || 0),
      subtitle: "nouveaux ajouts",
      icon: PackageSearch,
      color: "var(--card-accent-purple)",
    },
    {
      title: "Réunions",
      value: String(data?.meetingsCount || 0),
      subtitle: `${data?.meetingsWithSummaryCount || 0} avec résumé IA`,
      icon: ClipboardCheck,
      color: "var(--card-accent-yellow)",
    },
    {
      title: "Sondages ouverts",
      value: String(data?.openPollCount || 0),
      subtitle: "votes en cours",
      icon: Vote,
      color: "var(--card-accent-mint)",
    },
    {
      title: "Soirées à venir",
      value: String(data?.upcomingSoireeCount || 0),
      subtitle: "événements planifiés",
      icon: CalendarClock,
      color: "var(--card-accent-coral)",
    },
    {
      title: "Membres actifs",
      value: String(data?.memberCount || 0),
      subtitle: "sur la plateforme",
      icon: Users,
      color: "var(--card-accent-purple)",
    },
  ];

  const workflowSteps = [
    {
      id: "01",
      title: "Planifier",
      description: "Cadrez les reunions et transformez les idees en decisions exploitables.",
    },
    {
      id: "02",
      title: "Executer",
      description: "Assignez les taches et suivez l'avancement des equipes en continu.",
    },
    {
      id: "03",
      title: "Mesurer",
      description: "Analysez commandes, votes et activite pour ajuster les actions.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-hero max-w-[12ch]">Tableau de bord</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Vue d&apos;ensemble opérationnelle de l&apos;AEEG
        </p>
      </div>

      <section className="grid grid-cols-1 gap-3 border-y border-[var(--border-color)] py-6 md:grid-cols-3">
        {workflowSteps.map((step) => (
          <div key={step.id} className="space-y-2 pr-4">
            <p className="mono-meta text-[var(--text-muted)]">
              {step.id}
            </p>
            <p className="font-semibold">{step.title}</p>
            <p className="text-sm text-[var(--text-secondary)]">{step.description}</p>
          </div>
        ))}
      </section>

      {isSuperAdmin && (
        <>
          <AdminPanel />
          <Separator />
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} accentColor={card.color}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                      {card.title}
                    </p>
                    <p className="text-2xl font-black mt-1 font-mono">{card.value}</p>
                    <p className="text-xs font-bold text-[var(--text-muted)] mt-1">
                      {card.subtitle}
                    </p>
                  </div>
                  <div
                    className="p-2 rounded-[var(--radius-element)] border-2 border-[var(--border-color)]"
                    style={{ backgroundColor: card.color }}
                  >
                    <Icon className="h-5 w-5 text-black" strokeWidth={3} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <Card accentColor="var(--card-accent-teal)">
          <CardHeader>
            <CardTitle className="text-base">Prochaines echeances</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.upcoming || []).length === 0 ? (
              <p className="text-sm font-bold text-[var(--text-secondary)]">
                Aucune échéance à venir.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(data?.upcoming || []).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[var(--radius-element)] border-2 border-[var(--border-color)] p-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-black truncate">{item.title}</p>
                      <Badge
                        variant={
                          item.type === "task"
                            ? "warning"
                            : item.type === "meeting"
                            ? "info"
                            : "purple"
                        }
                      >
                        {item.type === "task"
                          ? "Tâche"
                          : item.type === "meeting"
                          ? "Réunion"
                          : "Soirée"}
                      </Badge>
                    </div>
                    <p className="text-xs font-bold text-[var(--text-secondary)] mt-1">
                      {item.subtitle}
                    </p>
                    <p className="text-xs font-bold text-[var(--text-muted)] mt-1">
                      {formatDateTime(item.date)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ActivityFeed activities={data?.activities || []} />
      </div>
    </div>
  );
}
