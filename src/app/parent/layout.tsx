import Link from "next/link";
import { Heart, LogOut } from "lucide-react";
import { requireParent } from "@/lib/auth";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireParent();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <Link href="/parent" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-healthcare text-healthcare-foreground">
              <Heart className="size-4" aria-hidden />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Carnet de Santé
            </span>
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
            >
              <LogOut className="size-3.5" />
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">{children}</main>
    </div>
  );
}
