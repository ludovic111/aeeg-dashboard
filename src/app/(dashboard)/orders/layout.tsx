import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commandes",
  description:
    "Suivi des commandes et ventes du shop AEEG (mercheg.com). Gestion des produits et expéditions.",
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
