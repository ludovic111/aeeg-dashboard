"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES } from "@/lib/constants";
import type { Profile, TaskPriority } from "@/types";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  assigneeFilter: string;
  onAssigneeChange: (value: string) => void;
  members: Profile[];
  onReset: () => void;
}

export function TaskFilters({
  search,
  onSearchChange,
  priorityFilter,
  onPriorityChange,
  assigneeFilter,
  onAssigneeChange,
  members,
  onReset,
}: TaskFiltersProps) {
  const hasFilters = search || priorityFilter || assigneeFilter;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground)]/40"
          strokeWidth={3}
        />
        <Input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={priorityFilter} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priorité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes</SelectItem>
          {Object.entries(TASK_PRIORITIES).map(([key, val]) => (
            <SelectItem key={key} value={key}>
              {val.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={assigneeFilter} onValueChange={onAssigneeChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Assigné à" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="unassigned">Non assigné</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.full_name || m.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-4 w-4" strokeWidth={3} />
          Réinitialiser
        </Button>
      )}
    </div>
  );
}
