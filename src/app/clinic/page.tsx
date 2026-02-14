import Link from "next/link";
import {
  UserPlus,
  Brain,
  FolderOpen,
  Stethoscope,
  MessageCircleWarning,
} from "lucide-react";
import { requireAuth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChildSearch } from "./child-search";

export default async function ClinicDashboardPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-8">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-linear-to-br from-healthcare/8 via-healthcare/4 to-transparent px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-healthcare text-healthcare-foreground shadow-sm">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Espace Clinique
            </h1>
            <p className="text-muted-foreground text-sm">
              Gérez les dossiers de santé, les vaccinations et les consultations
              pédiatriques.
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/clinic/register" className="group">
          <Card className="h-full border-transparent transition-all hover:border-healthcare/30 hover:shadow-md">
            <CardContent className="flex items-start gap-3.5 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-healthcare/10 transition-colors group-hover:bg-healthcare/20">
                <UserPlus className="size-5 text-healthcare" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Nouveau dossier</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  Inscrire un nouveau-né et générer un identifiant unique
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clinic/reports" className="group">
          <Card className="h-full border-transparent transition-all hover:border-amber-300/40 hover:shadow-md">
            <CardContent className="flex items-start gap-3.5 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100/60 transition-colors group-hover:bg-amber-100">
                <MessageCircleWarning className="size-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Signalements</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  Voir les signalements post-vaccination des parents
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clinic/risk" className="group">
          <Card className="h-full border-transparent transition-all hover:border-purple-300/40 hover:shadow-md">
            <CardContent className="flex items-start gap-3.5 p-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-100/60 transition-colors group-hover:bg-purple-100">
                <Brain className="size-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">Analyse IA</p>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  Estimer le risque néonatal à partir des données maternelles
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Search section ────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <FolderOpen className="size-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Dossiers de santé</CardTitle>
              <CardDescription className="text-xs">
                Recherchez un enfant par identifiant unique pour consulter ou
                mettre à jour son carnet
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ChildSearch />
        </CardContent>
      </Card>
    </div>
  );
}
