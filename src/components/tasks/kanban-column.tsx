"use client";

import { Droppable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskStatus } from "@/types";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddClick: (status: TaskStatus) => void;
}

const columnColors: Record<TaskStatus, string> = {
  todo: "color-mix(in srgb, var(--accent-yellow) 26%, transparent)",
  in_progress: "color-mix(in srgb, var(--accent-teal) 20%, transparent)",
  done: "color-mix(in srgb, var(--accent-gold) 18%, transparent)",
};

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddClick,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[85vw] sm:min-w-[280px] w-full sm:w-80 snap-start">
      <div
        className="flex items-center justify-between rounded-t-[1rem] border border-b-0 border-[var(--border-color)] p-3"
        style={{ backgroundColor: columnColors[status] }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            {TASK_STATUSES[status].label}
          </h3>
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] text-[11px] font-medium">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 border border-[var(--border-color)] bg-[var(--card-bg)] p-0 hover:bg-[var(--foreground)] hover:text-[var(--background)]"
          onClick={() => onAddClick(status)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
        </Button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-[200px] space-y-2 rounded-b-[1rem] border border-t-0 border-[var(--border-color)] p-2 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-[var(--foreground)]/6"
                : "bg-[var(--card-bg)]/55"
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onClick={onTaskClick}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex h-20 items-center justify-center text-sm text-[var(--text-muted)]">
                Glisser une tâche ici
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
