import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-2xl font-bold">Carnet de Santé Numérique</h1>
      <p className="text-muted-foreground text-center text-sm max-w-md">
        Dossier de santé numérique de l&apos;enfant, vérifié par la clinique.
      </p>
      <Link
        href="/clinic/register"
        className="inline-flex h-10 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Nouveau dossier
      </Link>
    </div>
  );
}
