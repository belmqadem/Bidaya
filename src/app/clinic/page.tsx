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
} from "@/components/ui/card";
import { ChildSearch } from "./child-search";
import { getReportCounts } from "./report-actions";

export default async function ClinicDashboardPage() {
  const session = await requireAuth();
  const counts = await getReportCounts();

  return (
    <div className="space-y-8">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-linear-to-br from-healthcare/8 via-healthcare/4 to-transparent px-6 py-8">
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/clinic/register" className="group">
          <Card className="h-full border-transparent transition-all hover:border-healthcare/30 hover:shadow-md">
            <CardContent className="flex items-start gap-3.5 p-5">
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
          <Card className={`h-full transition-all hover:shadow-md ${counts.open > 0 ? "border-amber-300/50 bg-amber-50/30" : "border-transparent"} hover:border-amber-300/40`}>
            <CardContent className="flex items-start gap-3.5 p-5">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100/60 transition-colors group-hover:bg-amber-100">
                <MessageCircleWarning className="size-5 text-amber-600" />
                {counts.open > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                    {counts.open}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Signalements</p>
                  {/* {counts.open > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      {counts.open} en attente
                    </span>
                  )} */}
                </div>
                <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                  {counts.total > 0
                    ? `${counts.total} signalement${counts.total > 1 ? "s" : ""} au total`
                    : "Voir les signalements post-vaccination des parents"}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clinic/risk" className="group">
          <Card className="h-full border-transparent transition-all hover:border-purple-300/40 hover:shadow-md">
            <CardContent className="flex items-start gap-3.5 p-5">
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
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <FolderOpen className="size-4 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Dossiers de santé</h2>
            <p className="text-muted-foreground text-xs">
              Recherchez un enfant par identifiant unique pour consulter ou
              mettre à jour son carnet
            </p>
          </div>
        </div>
        <ChildSearch />
      </div>
    </div>
  );
}
