"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { TASK_PRIORITIES } from "@/lib/constants";
import { formatShortDate, truncate } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  index: number;
  onClick: (task: Task) => void;
}

const priorityVariants: Record<string, "default" | "success" | "warning" | "danger" | "info" | "purple" | "coral"> = {
  low: "success",
  medium: "warning",
  high: "coral",
  urgent: "danger",
};

export function TaskCard({ task, index, onClick }: TaskCardProps) {
  const isOverdue =
    task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`p-3 rounded-lg border-2 border-[var(--border-color)] bg-[var(--card-bg)] cursor-pointer transition-all ${
            snapshot.isDragging
              ? "shadow-[6px_6px_0px_0px_var(--shadow-color)] -rotate-2"
              : "shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_var(--shadow-color)]"
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-bold text-sm leading-tight">
              {truncate(task.title, 60)}
            </h4>
            <Badge variant={priorityVariants[task.priority]} className="shrink-0 text-[10px]">
              {TASK_PRIORITIES[task.priority].label}
            </Badge>
          </div>

          {task.description && (
            <p className="text-xs text-[var(--foreground)]/60 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {task.deadline && (
                <span
                  className={`flex items-center gap-1 text-xs font-mono ${
                    isOverdue ? "text-brutal-red font-bold" : "text-[var(--foreground)]/50"
                  }`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <Clock className="h-3 w-3" strokeWidth={2} />
                  )}
                  {formatShortDate(task.deadline)}
                </span>
              )}
            </div>
            {task.assignee && (
              <Avatar
                name={task.assignee.full_name}
                src={task.assignee.avatar_url}
                size="sm"
              />
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
