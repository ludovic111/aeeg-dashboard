"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export function useMembers() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .neq("role", "pending")
      .order("full_name", { ascending: true });
    setMembers((data as Profile[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadInitialMembers() {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("role", "pending")
        .order("full_name", { ascending: true });

      if (!active) return;
      setMembers((data as Profile[]) || []);
      setLoading(false);
    }

    loadInitialMembers();
    return () => {
      active = false;
    };
  }, [supabase]);

  return { members, loading, refetch: fetchMembers };
}

export function useUpdateProfile() {
  const supabase = createClient();

  const updateProfile = async (
    id: string,
    data: { full_name?: string; phone?: string; bio?: string }
  ) => {
    const { error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", id);
    return { error };
  };

  return { updateProfile };
}
