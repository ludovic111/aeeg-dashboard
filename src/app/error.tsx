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
      <Card accentColor="var(--accent-orange)" className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <h2 className="font-[var(--font-display)] text-[2.3rem] leading-[0.95] mb-2">
            Une erreur est survenue
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Quelque chose s&apos;est mal passé. Veuillez réessayer.
          </p>
          <Button onClick={reset}>Réessayer</Button>
        </CardContent>
      </Card>
    </div>
  );
}
