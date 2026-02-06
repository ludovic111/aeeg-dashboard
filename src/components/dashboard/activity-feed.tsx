"use client";

import { formatRelative } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

interface Activity {
  id: string;
  type: "meeting" | "task" | "sale" | "member";
  description: string;
  user_name: string;
  user_avatar?: string | null;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  meeting: "MEETING",
  task: "TASK",
  sale: "SALE",
  member: "MEMBER",
};

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card accentColor="var(--card-accent-mint)" accentPosition="left">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Activite recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--text-secondary)]">
            Aucune activité récente
          </p>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 pb-3 border-b-2 border-[var(--border-color)]/20 last:border-0"
              >
                <Avatar
                  name={activity.user_name}
                  src={activity.user_avatar}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    <span className="mr-2 mono-meta text-[var(--text-muted)]">
                      {typeIcons[activity.type] || "ITEM"}
                    </span>
                    {activity.description}
                  </p>
                  <p className="mt-0.5 text-xs font-mono text-[var(--text-muted)]">
                    {formatRelative(activity.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
