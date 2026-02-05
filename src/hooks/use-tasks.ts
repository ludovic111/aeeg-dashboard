"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select(
        "*, assignee:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url), creator:profiles!tasks_created_by_fkey(id, full_name)"
      )
      .order("position", { ascending: true });
    setTasks((data as unknown as Task[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchTasks]);

  const setTasksOptimistic = (newTasks: Task[]) => {
    setTasks(newTasks);
  };

  return { tasks, loading, refetch: fetchTasks, setTasksOptimistic };
}

export function useTaskMutations() {
  const supabase = createClient();

  const createTask = async (data: Partial<Task>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get max position for the status
    const { data: maxPosData } = await supabase
      .from("tasks")
      .select("position")
      .eq("status", data.status || "todo")
      .order("position", { ascending: false })
      .limit(1);

    const maxPos = maxPosData?.[0]?.position ?? -1;

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        ...data,
        created_by: user?.id,
        position: maxPos + 1,
      })
      .select()
      .single();

    return { task, error };
  };

  const updateTask = async (id: string, data: Partial<Task>) => {
    const { error } = await supabase.from("tasks").update(data).eq("id", id);
    return { error };
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    return { error };
  };

  const updateTaskPosition = async (
    id: string,
    status: string,
    position: number
  ) => {
    const { error } = await supabase
      .from("tasks")
      .update({ status, position })
      .eq("id", id);
    return { error };
  };

  return { createTask, updateTask, deleteTask, updateTaskPosition };
}
