import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carnet de Santé Enfant",
  description: "Dossier médical numérique pour le suivi pédiatrique",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
