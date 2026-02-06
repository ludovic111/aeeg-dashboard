import type { Metadata } from "next";
import { SiteCredit } from "@/components/layout/site-credit";
import { ScrollAnimationProvider } from "@/components/scroll-animation-provider";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous au dashboard interne de l'AEEG pour accéder aux outils de gestion du comité.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScrollAnimationProvider>
    <div className="min-h-dvh bg-[var(--background)] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14" style={{ paddingBottom: "max(env(safe-area-inset-bottom), 2rem)" }}>
      <div className="mx-auto grid max-w-[1400px] gap-8 sm:gap-12 lg:grid-cols-[1.25fr_minmax(360px,460px)] lg:items-end">
        <div className="animate-on-load space-y-4 sm:space-y-6">
          <p className="display-eyebrow">AEEG Internal Platform</p>
          <h1 className="display-hero">
            Association d&apos;eleves <em>d&apos;Emilie Gourd</em>
          </h1>
          <div className="nds-fade-sequence max-w-[760px] space-y-3 sm:space-y-4 text-[15px] sm:text-base">
            <p>
              Accedez a l&apos;espace interne pour coordonner les reunions,
              actions, soirees, commandes et ressources partagees.
            </p>
            <p className="hidden sm:block">
              Une validation d&apos;acces est requise pour garantir la
              confidentialite des informations du comite.
            </p>
            <p className="mono-meta text-[var(--text-muted)]">
              AEEG · dashboard prive
            </p>
          </div>
        </div>

        <div className="w-full lg:justify-self-end animate-on-load" style={{ animationDelay: "400ms" }}>
          <div className="mx-auto w-full max-w-md space-y-5 sm:space-y-7">
            {children}
            <div className="text-center">
              <SiteCredit />
            </div>
          </div>
        </div>
      </div>
    </div>
    </ScrollAnimationProvider>
  );
}
