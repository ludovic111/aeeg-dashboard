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
  todo: "#FFE66D",
  in_progress: "#4ECDC4",
  done: "#95E1D3",
};

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
  onAddClick,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col min-w-[280px] w-full sm:w-80">
      {/* Column Header */}
      <div
        className="flex items-center justify-between p-3 rounded-t-lg border-2 border-[var(--border-color)] border-b-0"
        style={{ backgroundColor: columnColors[status] }}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-black text-sm text-black">
            {TASK_STATUSES[status].label}
          </h3>
          <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border-2 border-black bg-white text-xs font-black text-black">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 border-2 border-black bg-white hover:bg-black hover:text-white"
          onClick={() => onAddClick(status)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={3} />
        </Button>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-2 min-h-[200px] rounded-b-lg border-2 border-[var(--border-color)] border-t-0 transition-colors ${
              snapshot.isDraggingOver
                ? "bg-[var(--border-color)]/5"
                : "bg-[var(--background)]"
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
              <div className="flex items-center justify-center h-20 text-sm text-[var(--foreground)]/30 font-bold">
                Glisser une tâche ici
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
