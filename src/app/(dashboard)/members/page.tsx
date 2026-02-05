"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMembers } from "@/hooks/use-members";
import { MemberCard } from "@/components/members/member-card";
import { MemberProfile } from "@/components/members/member-profile";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLES } from "@/lib/constants";
import type { Profile } from "@/types";

export default function MembersPage() {
  const { profile: currentUser } = useAuth();
  const { members, loading, refetch } = useMembers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (
        search &&
        !m.full_name.toLowerCase().includes(search.toLowerCase()) &&
        !m.email.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      return true;
    });
  }, [members, search, roleFilter]);

  const handleMemberClick = (member: Profile) => {
    setSelectedMember(member);
    setProfileOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">👥 Annuaire des membres</h1>
        <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
          {members.length} membres enregistrés
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/40"
            strokeWidth={3}
          />
          <Input
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            {Object.entries(ROLES).map(([key, val]) => (
              <SelectItem key={key} value={key}>
                {val.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filtered.length !== members.length && (
          <Badge variant="default">{filtered.length} résultat(s)</Badge>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🔍</p>
          <p className="font-black text-lg">Aucun membre trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onClick={handleMemberClick}
            />
          ))}
        </div>
      )}

      <MemberProfile
        open={profileOpen}
        onOpenChange={setProfileOpen}
        member={selectedMember}
        isOwnProfile={selectedMember?.id === currentUser?.id}
        onRefresh={refetch}
      />
    </div>
  );
}
