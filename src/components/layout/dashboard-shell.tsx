"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteCredit } from "@/components/layout/site-credit";
import type { Profile } from "@/types";

interface DashboardShellProps {
  profile: Profile | null;
  children: React.ReactNode;
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [supabase, router]);

  return (
    <AuthProvider initialProfile={profile}>
      <DashboardChrome onSignOut={handleSignOut}>{children}</DashboardChrome>
    </AuthProvider>
  );
}

interface DashboardChromeProps {
  onSignOut: () => void;
  children: React.ReactNode;
}

function DashboardChrome({ onSignOut, children }: DashboardChromeProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="flex min-h-dvh bg-[var(--background)]">
      <Sidebar profile={profile} onSignOut={onSignOut} />
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        profile={profile}
        onSignOut={onSignOut}
      />
      <div className="flex-1 flex flex-col min-h-dvh overflow-hidden">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-3 pb-28 sm:p-6 sm:pb-8 lg:p-8 lg:pb-8">
          {children}
          <div className="mt-8 text-center">
            <SiteCredit />
          </div>
        </main>
        <BottomNav onMenuClick={() => setMobileNavOpen(true)} />
      </div>
    </div>
  );
}
