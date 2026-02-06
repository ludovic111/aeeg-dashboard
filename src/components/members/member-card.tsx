"use client";

import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ROLES } from "@/lib/constants";
import type { Profile } from "@/types";

const roleBadgeVariants: Record<string, "danger" | "coral" | "purple" | "warning"> = {
  superadmin: "danger",
  admin: "coral",
  committee_member: "purple",
  pending: "warning",
};

const roleAccentColors: Record<string, string> = {
  superadmin: "var(--card-accent-coral)",
  admin: "var(--card-accent-coral)",
  committee_member: "var(--card-accent-purple)",
  pending: "var(--card-accent-yellow)",
};

interface MemberCardProps {
  member: Profile;
  onClick: (member: Profile) => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  return (
    <Card
      accentColor={roleAccentColors[member.role]}
      className="cursor-pointer transition-colors hover:border-[var(--accent-gold)]"
      onClick={() => onClick(member)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar
            name={member.full_name || member.email}
            src={member.avatar_url}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-base truncate">
              {member.full_name || "Sans nom"}
            </h3>
            <Badge variant={roleBadgeVariants[member.role]} className="mt-1">
              {ROLES[member.role].label}
            </Badge>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span className="font-mono truncate text-xs">{member.email}</span>
          </div>
          {member.phone && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              <span className="font-mono text-xs">{member.phone}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
