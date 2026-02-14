import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ChildSearch } from "./child-search";

export default async function ClinicDashboardPage() {
  const session = await requireAuth();

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Connecté en tant que {session.email}
          </p>
        </div>
        <Link href="/clinic/register">
          <Button
            size="sm"
            className="bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
          >
            <UserPlus className="mr-1.5 size-4" />
            Inscrire un enfant
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        <ChildSearch />
      </div>
    </>
  );
}
