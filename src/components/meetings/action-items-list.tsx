"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useMeetingMutations } from "@/hooks/use-meetings";
import type { MeetingActionItem } from "@/types";

interface ActionItemsListProps {
  meetingId: string;
  items: MeetingActionItem[];
  canEdit: boolean;
  onRefresh: () => void;
}

export function ActionItemsList({
  meetingId,
  items,
  canEdit,
  onRefresh,
}: ActionItemsListProps) {
  const [newDescription, setNewDescription] = useState("");
  const [adding, setAdding] = useState(false);
  const { addActionItem, updateActionItem, deleteActionItem } =
    useMeetingMutations();

  const handleAdd = async () => {
    if (!newDescription.trim()) return;
    setAdding(true);
    const { error } = await addActionItem(meetingId, {
      description: newDescription.trim(),
    });
    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Action ajoutée");
      setNewDescription("");
      onRefresh();
    }
    setAdding(false);
  };

  const handleToggle = async (item: MeetingActionItem) => {
    const newStatus = item.status === "done" ? "pending" : "done";
    const { error } = await updateActionItem(item.id, { status: newStatus });
    if (error) {
      toast.error("Erreur");
    } else {
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteActionItem(id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Action supprimée");
      onRefresh();
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
        Actions ({items.length})
      </h3>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] p-3 space-y-3"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={item.status === "done"}
                onCheckedChange={() => handleToggle(item)}
              />
              <span
                className={`flex-1 text-sm font-bold ${
                  item.status === "done"
                    ? "line-through text-[var(--foreground)]/40"
                    : ""
                }`}
              >
                {item.description}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {item.assignee && (
                <Avatar
                  name={item.assignee.full_name}
                  src={item.assignee.avatar_url}
                  size="sm"
                />
              )}
              <Badge variant={item.status === "done" ? "success" : "warning"}>
                {item.status === "done" ? "Fait" : "En attente"}
              </Badge>
              {canEdit && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1 rounded border-2 border-[var(--border-color)] hover:bg-brutal-red hover:text-white transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Nouvelle action..."
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={adding}>
            <Plus className="h-4 w-4" strokeWidth={3} />
          </Button>
        </div>
      )}
    </div>
  );
}
