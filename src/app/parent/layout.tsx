import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "parent") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-medium">Parent</span>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-muted-foreground hover:text-foreground text-sm underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
