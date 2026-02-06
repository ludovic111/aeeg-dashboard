"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ScrollAnimationProvider } from "@/components/scroll-animation-provider";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
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
    <ScrollAnimationProvider>
    <div className="min-h-dvh bg-[var(--background)]">
      <Header onMenuClick={() => setMobileNavOpen(true)} />
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        profile={profile}
        onSignOut={onSignOut}
      />
      <main className="mx-auto w-full max-w-[1480px] px-4 pb-20 pt-10 sm:px-6 md:px-10 lg:px-14 lg:pt-14">
        <div className="space-y-10">
          {children}
          <div className="border-t border-[var(--border-color)] pt-8 text-center">
            <SiteCredit />
            <p className="page-wordmark mt-10 text-left">AEEG</p>
          </div>
        </div>
      </main>
    </div>
    </ScrollAnimationProvider>
  );
}
