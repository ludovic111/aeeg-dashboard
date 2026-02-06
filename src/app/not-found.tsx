import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Card accentColor="#D4A847" className="max-w-md w-full">
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
