import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Page introuvable",
  description:
    "La page que vous recherchez n'existe pas sur le dashboard AEEG.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Card accentColor="var(--card-accent-gold)" className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <p className="text-6xl mb-2 font-[var(--font-mono-family)]">404</p>
          <h2 className="font-[var(--font-display)] text-[2.3rem] leading-[0.95] mb-2">
            Page introuvable
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            La page que vous recherchez n&apos;existe pas.
          </p>
          <Link href="/">
            <Button>Retour à l&apos;accueil</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
