"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PendingPage() {
  const router = useRouter();
  const supabase = createClient();

  // Poll every 10 seconds to check if role has changed
  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = profile?.role as string | undefined;
      if (role && role !== "pending" && role !== "regular_member") {
        router.push("/");
        router.refresh();
      }
    };

    // Check immediately on mount
    checkRole();

    // Then poll every 10 seconds
    const interval = setInterval(checkRole, 10000);
    return () => clearInterval(interval);
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <Card accentColor="#D4A847">
      <CardContent className="p-8 text-center">
        <h2 className="font-[var(--font-display)] text-[2.3rem] leading-[0.92] mb-2">
          Demande en cours d&apos;examen
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          Votre demande d&apos;acces a bien ete envoyee.
        </p>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Un administrateur doit approuver votre compte avant que vous puissiez
          acceder au tableau de bord. Vous serez redirige automatiquement une
          fois votre compte approuve.
        </p>

        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" strokeWidth={3} />
          Se deconnecter
        </Button>
      </CardContent>
    </Card>
  );
}
