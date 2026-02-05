"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Card accentColor="#FF6B6B" className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <p className="text-5xl mb-4">💥</p>
          <h2 className="text-2xl font-black mb-2">Une erreur est survenue</h2>
          <p className="text-sm text-[var(--foreground)]/60 font-bold mb-6">
            Quelque chose s&apos;est mal passé. Veuillez réessayer.
          </p>
          <Button onClick={reset}>Réessayer</Button>
        </CardContent>
      </Card>
    </div>
  );
}
