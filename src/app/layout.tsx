import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bidaya — Carnet de santé numérique vérifié par la clinique",
  description:
    "Dossier de santé numérique de l'enfant, vérifié par la clinique. Historique vaccinal et consultations accessibles via un identifiant unique.",
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
