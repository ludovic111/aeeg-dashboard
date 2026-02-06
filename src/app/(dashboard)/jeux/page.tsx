import Link from "next/link";
import { Clock3, Gamepad2, Rocket } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AVAILABLE_GAMES = [
  {
    id: "escape-from-lara",
    name: "Escape From Lara",
    description:
      "Esquivez les salves de Lara et survivez le plus longtemps possible.",
    href: "/jeux/escape-from-lara",
    accentColor: "var(--card-accent-teal)",
  },
  {
    id: "vendredi-midi-simulator",
    name: "Vendredi Midi Simulator",
    description:
      "Controlez Leo chez Miams: suivez des commandes aleatoires et achetez un maximum de plats.",
    href: "/jeux/vendredi-midi-simulator",
    accentColor: "var(--card-accent-orange)",
  },
] as const;

export default function JeuxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-hero max-w-[6ch]">Jeux</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Choisissez un jeu puis lancez votre partie.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {AVAILABLE_GAMES.map((game) => (
          <Card key={game.id} accentColor={game.accentColor}>
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Rocket className="h-5 w-5" strokeWidth={3} />
                {game.name}
              </CardTitle>
              <CardDescription className="font-bold">
                {game.description}
              </CardDescription>
            </CardHeader>
            <CardFooter className="justify-end">
              <Link href={game.href} className={buttonVariants()}>
                Jouer
              </Link>
            </CardFooter>
          </Card>
        ))}

        <Card accentColor="var(--card-accent-yellow)">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gamepad2 className="h-5 w-5" strokeWidth={3} />
              Prochains jeux
            </CardTitle>
            <CardDescription className="font-bold">
              Cette section accueillera les prochains jeux de l&apos;espace membre.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-bold text-[var(--text-secondary)]">
              Ajoutez un nouveau jeu sous <code>/src/app/(dashboard)/jeux</code>{" "}
              puis créez sa carte ici.
            </p>
          </CardContent>
          <CardFooter className="justify-end">
            <span className="inline-flex items-center gap-2 rounded-[var(--radius-element)] border-2 border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2 text-sm font-black text-[var(--text-secondary)]">
              <Clock3 className="h-4 w-4" strokeWidth={3} />
              Bientot
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
