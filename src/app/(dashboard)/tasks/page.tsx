"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useTasks, useTaskMutations } from "@/hooks/use-tasks";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { TaskDialog } from "@/components/tasks/task-dialog";
import { TaskFilters } from "@/components/tasks/task-filters";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile, Task, TaskStatus } from "@/types";
import type { TaskFormData } from "@/lib/validations";

export default function TasksPage() {
  const { tasks, loading, refetch, setTasksOptimistic } = useTasks();
  const { createTask, updateTask, deleteTask } = useTaskMutations();
  const [members, setMembers] = useState<Profile[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");
  const [mutating, setMutating] = useState(false);
  const supabase = createClient();

  // Filters
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .then(({ data }) => setMembers(data || []));
  }, [supabase]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (assigneeFilter === "unassigned" && t.assigned_to) return false;
      if (
        assigneeFilter !== "all" &&
        assigneeFilter !== "unassigned" &&
        t.assigned_to !== assigneeFilter
      )
        return false;
      return true;
    });
  }, [tasks, search, priorityFilter, assigneeFilter]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };

  const handleAddClick = (status: TaskStatus) => {
    setSelectedTask(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: TaskFormData) => {
    setMutating(true);
    if (selectedTask) {
      const { error } = await updateTask(selectedTask.id, {
        title: data.title,
        description: data.description || null,
        status: data.status as TaskStatus,
        priority: data.priority as Task["priority"],
        assigned_to: data.assigned_to || null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      });
      if (error) {
        toast.error(error.message || "Erreur lors de la mise à jour");
        setMutating(false);
        return;
      }
      toast.success("Tâche mise à jour !");
    } else {
      const { error } = await createTask({
        title: data.title,
        description: data.description || null,
        status: data.status as TaskStatus,
        priority: data.priority as Task["priority"],
        assigned_to: data.assigned_to || null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      });
      if (error) {
        toast.error(error.message || "Erreur lors de la création");
        setMutating(false);
        return;
      }
      toast.success("Tâche créée !");
    }
    setMutating(false);
    setDialogOpen(false);
    refetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette tâche ?")) return;
    const { error } = await deleteTask(id);
    if (error) toast.error("Erreur lors de la suppression");
    else toast.success("Tâche supprimée");
    setDialogOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">✅ Tableau des tâches</h1>
        <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
          Gérer et organiser les tâches de l&apos;association
        </p>
      </div>

      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        members={members}
        onReset={() => {
          setSearch("");
          setPriorityFilter("all");
          setAssigneeFilter("all");
        }}
      />

      <KanbanBoard
        tasks={filteredTasks}
        setTasksOptimistic={setTasksOptimistic}
        onTaskClick={handleTaskClick}
        onAddClick={handleAddClick}
      />

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={selectedTask}
        defaultStatus={defaultStatus}
        members={members}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        loading={mutating}
      />
    </div>
  );
}
