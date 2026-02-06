import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Retours",
  description:
    "Donnez votre avis et consultez les retours des membres du comité AEEG.",
};

export default function FeedbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
