import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jeux",
  description:
    "Mini-jeux du comité AEEG. Détendez-vous avec les jeux créés par et pour les membres.",
};

export default function JeuxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
