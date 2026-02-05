"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UserRole } from "@/types";

export function useAdmin() {
  const [pendingMembers, setPendingMembers] = useState<Profile[]>([]);
  const [allMembers, setAllMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [pendingRes, membersRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .neq("role", "pending")
        .order("full_name", { ascending: true }),
    ]);

    setPendingMembers((pendingRes.data as Profile[]) || []);
    setAllMembers((membersRes.data as Profile[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      setLoading(true);

      const [pendingRes, membersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("role", "pending")
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("*")
          .neq("role", "pending")
          .order("full_name", { ascending: true }),
      ]);

      if (!active) return;
      setPendingMembers((pendingRes.data as Profile[]) || []);
      setAllMembers((membersRes.data as Profile[]) || []);
      setLoading(false);
    }

    loadInitialData();
    return () => {
      active = false;
    };
  }, [supabase]);

  // Realtime subscription on profiles table
  useEffect(() => {
    const channel = supabase
      .channel("admin-profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchData]);

  const approveMember = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: "committee_member" })
      .eq("id", id);
    if (!error) fetchData();
    return { error };
  };

  const rejectMember = async (id: string) => {
    const response = await fetch(`/api/admin/members?id=${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      fetchData();
      return { error: null };
    }
    const data = await response.json();
    return { error: data.error || "Erreur lors de la suppression" };
  };

  const updateMemberRole = async (id: string, role: UserRole) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);
    if (!error) fetchData();
    return { error };
  };

  const deleteMember = async (id: string) => {
    const response = await fetch(`/api/admin/members?id=${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      fetchData();
      return { error: null };
    }
    const data = await response.json();
    return { error: data.error || "Erreur lors de la suppression" };
  };

  return {
    pendingMembers,
    allMembers,
    loading,
    approveMember,
    rejectMember,
    updateMemberRole,
    deleteMember,
    refetch: fetchData,
  };
}
