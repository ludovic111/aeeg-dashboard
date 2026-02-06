import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil",
  description:
    "Gérez votre profil de membre du comité AEEG. Informations personnelles et paramètres.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
