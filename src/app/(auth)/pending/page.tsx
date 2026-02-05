"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut } from "lucide-react";
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
    <Card accentColor="#FFE66D">
      <CardContent className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-brutal-yellow/20 border-2 border-[var(--border-color)]">
            <Clock className="h-8 w-8 text-brutal-yellow" strokeWidth={3} />
          </div>
        </div>

        <h2 className="text-2xl font-black mb-2">
          Demande en cours d&apos;examen
        </h2>
        <p className="text-sm font-bold text-[var(--foreground)]/60 mb-2">
          Votre demande d&apos;acces a bien ete envoyee.
        </p>
        <p className="text-sm text-[var(--foreground)]/50 mb-6">
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
