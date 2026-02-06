import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "En attente de validation",
  description:
    "Votre demande d'accès au dashboard AEEG est en cours de validation par le comité.",
};

export default function PendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
