"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { useEffect } from "react";
import { taskSchema, type TaskFormData } from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { Task, Profile, TaskStatus, TaskPriority } from "@/types";

const UNASSIGNED_VALUE = "__unassigned__";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
  members: Profile[];
  onSubmit: (data: TaskFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  loading?: boolean;
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = "todo",
  members,
  onSubmit,
  onDelete,
  loading,
}: TaskDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || defaultStatus,
      priority: task?.priority || "medium",
      assigned_to: task?.assigned_to || "",
      deadline: task?.deadline
        ? new Date(task.deadline).toISOString().slice(0, 16)
        : "",
    },
  });

  const statusValue = useWatch({ control, name: "status" }) || defaultStatus;
  const priorityValue = useWatch({ control, name: "priority" }) || "medium";
  const assignedToValue = useWatch({ control, name: "assigned_to" });

  const handleFormSubmit = async (data: TaskFormData) => {
    await onSubmit(data);
    reset();
  };

  useEffect(() => {
    if (!open) return;

    reset({
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || defaultStatus,
      priority: task?.priority || "medium",
      assigned_to: task?.assigned_to || "",
      deadline: task?.deadline
        ? new Date(task.deadline).toISOString().slice(0, 16)
        : "",
    });
  }, [task, defaultStatus, open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Titre *</Label>
            <Input
              id="task-title"
              placeholder="Titre de la tâche"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm font-bold text-brutal-red">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea
              id="task-desc"
              placeholder="Détails de la tâche..."
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={statusValue}
                onValueChange={(v) => setValue("status", v as TaskStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_STATUSES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select
                value={priorityValue}
                onValueChange={(v) => setValue("priority", v as TaskPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TASK_PRIORITIES).map(([key, val]) => (
                    <SelectItem key={key} value={key}>
                      {val.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Assigné à</Label>
              <Select
                value={assignedToValue || UNASSIGNED_VALUE}
                onValueChange={(v) =>
                  setValue(
                    "assigned_to",
                    v === UNASSIGNED_VALUE ? "" : v
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Non assigné" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>Non assigné</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-deadline">Échéance</Label>
              <Input
                id="task-deadline"
                type="datetime-local"
                {...register("deadline")}
              />
            </div>
          </div>

          <DialogFooter>
            {task && onDelete && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-4 w-4" strokeWidth={3} />
                Supprimer
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading
                ? "Enregistrement..."
                : task
                ? "Mettre à jour"
                : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
