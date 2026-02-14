import { redirect } from "next/navigation";
import { getSessionPayload } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SelectRolePage() {
  const payload = await getSessionPayload();
  if (!payload?.email) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Choose your role</CardTitle>
          <CardDescription>
            How are you using the child health record?
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <RoleButton role="parent" />
          <RoleButton role="clinic" />
        </CardContent>
      </Card>
    </div>
  );
}

function RoleButton({ role }: { role: "parent" | "clinic" }) {
  const label = role === "parent" ? "Parent" : "Clinic staff";
  const description =
    role === "parent"
      ? "View my child's vaccination record"
      : "Search children and record vaccinations";

  return (
    <form action={`/api/auth/select-role?role=${role}`} method="POST">
      <Button
        type="submit"
        variant="outline"
        className="h-auto w-full flex-col gap-1 py-4"
      >
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground text-xs font-normal">
          {description}
        </span>
      </Button>
    </form>
  );
}
