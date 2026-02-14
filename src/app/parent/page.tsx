import { getSession } from "@/lib/auth";

export default async function ParentDashboardPage() {
  const session = await getSession();

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold">My child&apos;s record</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Signed in as {session?.email}. Parent dashboard placeholder.
      </p>
    </div>
  );
}
