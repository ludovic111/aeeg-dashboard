import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tâches",
  description:
    "Tableau Kanban des tâches du comité AEEG. Suivez l'avancement des actions et responsabilités.",
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
