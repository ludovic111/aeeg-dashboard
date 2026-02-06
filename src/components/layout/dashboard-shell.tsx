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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-[var(--radius-pill)] focus:bg-[var(--accent-yellow)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[var(--text-dark)]">
        Aller au contenu principal
      </a>
      <Header onMenuClick={() => setMobileNavOpen(true)} />
      <MobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        profile={profile}
        onSignOut={onSignOut}
      />
      <main id="main-content" className="mx-auto w-full max-w-[1480px] px-4 pt-8 sm:px-6 sm:pt-10 md:px-10 lg:px-14 lg:pt-14" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 5rem)" }}>
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
