"use client";

import {
  createElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isCommitteeMember: boolean;
  isPending: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  initialProfile: Profile | null;
  children: React.ReactNode;
}

export function AuthProvider({ initialProfile, children }: AuthProviderProps) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(initialProfile ? false : true);
  const supabase = createClient();

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile((data as Profile | null) ?? null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  useEffect(() => {
    if (initialProfile) {
      return;
    }

    void refreshProfile();
  }, [initialProfile, refreshProfile]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === "INITIAL_SESSION" && initialProfile) {
        return;
      }
      void refreshProfile();
    });

    return () => subscription.unsubscribe();
  }, [supabase, refreshProfile, initialProfile]);

  const isSuperAdmin = profile?.role === "superadmin";
  const isAdmin = profile?.role === "admin" || isSuperAdmin;
  const isCommitteeMember =
    profile?.role === "committee_member" || isAdmin;
  const roleValue = (profile?.role || "") as string;
  const isPending = roleValue === "pending" || roleValue === "regular_member";

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setLoading(false);
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      loading,
      isSuperAdmin,
      isAdmin,
      isCommitteeMember,
      isPending,
      signOut,
      refreshProfile,
    }),
    [
      profile,
      loading,
      isSuperAdmin,
      isAdmin,
      isCommitteeMember,
      isPending,
      signOut,
      refreshProfile,
    ]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
