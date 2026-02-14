import { requireParent } from "@/lib/auth";
import { ChildDashboard } from "./child-dashboard";

export default async function ParentDashboardPage() {
  const session = await requireParent();

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="text-lg font-semibold">My child&apos;s record</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Signed in &middot; {session.childIdentifier}
      </p>

      <div className="mt-6">
        <ChildDashboard />
      </div>
    </div>
  );
}
