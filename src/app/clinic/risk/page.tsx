import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NeonatalRiskPanel } from "../neonatal-risk-panel";

export default async function RiskAnalysisPage() {
  await requireRole("clinic");

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/clinic">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Analyse IA — Risque néonatal
          </h1>
          <p className="text-muted-foreground text-sm">
            Estimez le poids de naissance et le niveau de risque à partir des
            données maternelles.
          </p>
        </div>
      </div>

      <NeonatalRiskPanel />
    </div>
  );
}
