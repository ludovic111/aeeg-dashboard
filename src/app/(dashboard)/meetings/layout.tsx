import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réunions",
  description:
    "Consultez et gérez les réunions du comité AEEG. Ordres du jour, résumés et actions à suivre.",
};

export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
