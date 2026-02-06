import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aeeg.vercel.app"),
  title: {
    default: "AEEG — Association d'élèves d'Émilie Gourd",
    template: "%s — AEEG",
  },
  description:
    "Dashboard interne de l'Association d'élèves du Collège et École de Commerce Émilie-Gourd, Genève. Réunions, tâches, soirées, commandes et ressources partagées.",
  keywords: [
    "AEEG",
    "Émilie Gourd",
    "association élèves",
    "Genève",
    "collège",
    "comité",
    "dashboard",
  ],
  authors: [{ name: "AEEG" }],
  openGraph: {
    type: "website",
    locale: "fr_CH",
    siteName: "AEEG — Association d'élèves d'Émilie Gourd",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#0A0A0A",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${instrumentSerif.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AEEG — Association d'élèves d'Émilie Gourd",
              description:
                "Association d'élèves du Collège et École de Commerce Émilie-Gourd, Genève",
              url: "https://aeeg.vercel.app",
              logo: "https://aeeg.vercel.app/icon.svg",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Genève",
                addressCountry: "CH",
              },
            }),
          }}
        />
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
