"use client";

import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { KanbanColumn } from "./kanban-column";
import { useTaskMutations } from "@/hooks/use-tasks";
import type { Task, TaskStatus } from "@/types";

const STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];

interface KanbanBoardProps {
  tasks: Task[];
  setTasksOptimistic: (tasks: Task[]) => void;
  onTaskClick: (task: Task) => void;
  onAddClick: (status: TaskStatus) => void;
}

export function KanbanBoard({
  tasks,
  setTasksOptimistic,
  onTaskClick,
  onAddClick,
}: KanbanBoardProps) {
  const { updateTaskPosition } = useTaskMutations();

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    todo: tasks
      .filter((t) => t.status === "todo")
      .sort((a, b) => a.position - b.position),
    in_progress: tasks
      .filter((t) => t.status === "in_progress")
      .sort((a, b) => a.position - b.position),
    done: tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => a.position - b.position),
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    const destStatus = destination.droppableId as TaskStatus;

    // Optimistic update
    const updatedTasks = [...tasks];
    const taskIndex = updatedTasks.findIndex((t) => t.id === draggableId);
    if (taskIndex === -1) return;

    const movedTask = { ...updatedTasks[taskIndex] };
    movedTask.status = destStatus;
    movedTask.position = destination.index;

    updatedTasks.splice(taskIndex, 1);

    // Recalculate positions
    const destTasks = updatedTasks
      .filter((t) => t.status === destStatus)
      .sort((a, b) => a.position - b.position);
    destTasks.splice(destination.index, 0, movedTask);
    destTasks.forEach((t, i) => (t.position = i));

    const finalTasks = [
      ...updatedTasks.filter((t) => t.status !== destStatus),
      ...destTasks,
    ];

    setTasksOptimistic(finalTasks);

    // Persist
    const { error } = await updateTaskPosition(
      draggableId,
      destStatus,
      destination.index
    );

    if (error) {
      toast.error("Erreur lors du déplacement");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onTaskClick={onTaskClick}
            onAddClick={onAddClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
