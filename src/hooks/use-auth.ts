"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }

    getProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isSuperAdmin = profile?.role === "superadmin";
  const isAdmin = profile?.role === "admin" || isSuperAdmin;
  const isCommitteeMember =
    profile?.role === "committee_member" || isAdmin;
  const roleValue = (profile?.role || "") as string;
  const isPending = roleValue === "pending" || roleValue === "regular_member";

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return {
    profile,
    loading,
    isSuperAdmin,
    isAdmin,
    isCommitteeMember,
    isPending,
    signOut,
  };
}
