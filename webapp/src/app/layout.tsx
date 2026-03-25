import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MaklerToolkit — Ihr digitales Immobilien-Werkzeug",
  description:
    "Dashboard mit Stadtteil-Analyse, Kaufnebenkosten-Rechner, Exposé-Generator und Mini-CRM für Immobilienmakler in der Metropolregion Nürnberg.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
