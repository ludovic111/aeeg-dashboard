import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soirées",
  description:
    "Organisation des soirées et événements de l'AEEG. Planning, budget et tâches par événement.",
};

export default function PartiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
