import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Card accentColor="#FFE66D" className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <p className="text-6xl font-black mb-2 font-mono">404</p>
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-2xl font-black mb-2">Page introuvable</h2>
          <p className="text-sm text-[var(--foreground)]/60 font-bold mb-6">
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
