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
  meeting: "📋",
  task: "✅",
  sale: "🛍️",
  member: "👤",
};

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card accentColor="#95E1D3" accentPosition="left">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📰 Activité récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-[var(--foreground)]/50 font-bold text-center py-8">
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
                  <p className="text-sm font-bold">
                    <span className="mr-1">
                      {typeIcons[activity.type] || "📌"}
                    </span>
                    {activity.description}
                  </p>
                  <p className="text-xs text-[var(--foreground)]/50 font-mono mt-0.5">
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
