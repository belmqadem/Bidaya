import { getSession } from "@/lib/auth";

export default async function ClinicDashboardPage() {
  const session = await getSession();

  return (
    <div className="p-4">
      <h1 className="text-lg font-semibold">Clinic dashboard</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Signed in as {session?.email}. Clinic dashboard placeholder.
      </p>
    </div>
  );
}
