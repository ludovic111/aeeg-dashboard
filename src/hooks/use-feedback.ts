"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FeedbackStatus, UserFeedback } from "@/types";

export function useFeedback() {
  const [items, setItems] = useState<UserFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("user_feedback")
      .select(
        "*, creator:profiles!user_feedback_created_by_fkey(id, full_name, email, avatar_url)"
      )
      .order("created_at", { ascending: false });
    setItems((data as UserFeedback[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadInitialFeedback() {
      setLoading(true);
      const { data } = await supabase
        .from("user_feedback")
        .select(
          "*, creator:profiles!user_feedback_created_by_fkey(id, full_name, email, avatar_url)"
        )
        .order("created_at", { ascending: false });

      if (!active) return;
      setItems((data as UserFeedback[]) || []);
      setLoading(false);
    }

    loadInitialFeedback();
    return () => {
      active = false;
    };
  }, [supabase]);

  return { items, loading, refetch: fetchFeedback };
}

export function useFeedbackMutations() {
  const supabase = createClient();

  const createFeedback = async (data: {
    kind: "issue" | "recommendation";
    title: string;
    description: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("user_feedback")
      .insert({ ...data, created_by: user?.id });

    return { error };
  };

  const updateFeedbackStatus = async (id: string, status: FeedbackStatus) => {
    const { error } = await supabase
      .from("user_feedback")
      .update({ status })
      .eq("id", id);

    return { error };
  };

  return { createFeedback, updateFeedbackStatus };
}
