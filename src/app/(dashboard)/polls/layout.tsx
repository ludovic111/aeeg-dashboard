import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sondages",
  description:
    "Sondages internes du comité AEEG. Votez et consultez les résultats des décisions collectives.",
};

export default function PollsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
