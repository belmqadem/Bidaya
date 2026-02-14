import Link from "next/link";
import { UserPlus } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ChildSearch } from "./child-search";

export default async function ClinicDashboardPage() {
  const session = await requireAuth();

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Clinic dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Signed in as {session.email}
          </p>
        </div>
        <Link href="/clinic/register">
          <Button
            size="sm"
            className="bg-healthcare text-healthcare-foreground hover:bg-healthcare/90"
          >
            <UserPlus className="mr-1.5 size-4" />
            Register
          </Button>
        </Link>
      </div>

      <div className="mt-6">
        <ChildSearch />
      </div>
    </div>
  );
}
