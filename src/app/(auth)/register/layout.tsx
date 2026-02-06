import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demande d'accès",
  description:
    "Demandez l'accès au dashboard de l'AEEG. Réservé aux membres du comité de l'Association d'élèves d'Émilie Gourd.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
