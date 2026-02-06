"use client";

import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function setTutorialGateDone() {
  document.cookie = "tutorial_gate=done; path=/; samesite=lax";
}

function clearTutorialGate() {
  document.cookie = "tutorial_gate=; path=/; max-age=0; samesite=lax";
}

export default function WelcomePage() {
  const router = useRouter();

  const handleAlreadyWatched = () => {
    setTutorialGateDone();
    router.push("/login");
  };

  const handleNotWatched = () => {
    clearTutorialGate();
    router.push("/watch-tutorial");
  };

  return (
    <Card accentColor="#FFE66D">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <PlayCircle className="h-6 w-6" strokeWidth={3} />
          Vérification du tutoriel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-bold text-[var(--foreground)]/70">
          Avant de vous connecter, choisissez une option ci-dessous.
        </p>

        <Button
          type="button"
          className="w-full"
          onClick={handleAlreadyWatched}
        >
          J&apos;ai déjà regardé le tutoriel
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleNotWatched}
        >
          Je ne l&apos;ai pas encore regardé
        </Button>
      </CardContent>
    </Card>
  );
}
