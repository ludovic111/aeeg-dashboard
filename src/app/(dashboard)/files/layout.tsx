import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fichiers",
  description:
    "Espace de partage de fichiers du comité AEEG. Documents, PV et ressources partagées.",
};

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
