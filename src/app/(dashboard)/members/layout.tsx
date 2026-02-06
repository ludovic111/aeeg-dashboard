import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membres",
  description:
    "Annuaire des membres du comité AEEG. Rôles, coordonnées et gestion des accès.",
};

export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
