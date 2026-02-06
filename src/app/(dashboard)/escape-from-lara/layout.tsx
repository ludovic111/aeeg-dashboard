import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Escape from Lara",
  description:
    "Jeu Escape from Lara du comité AEEG. Un mini-jeu exclusif pour les membres.",
};

export default function EscapeFromLaraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
