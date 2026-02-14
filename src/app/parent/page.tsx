import { requireParent } from "@/lib/auth";
import { ChildDashboard } from "./child-dashboard";

export default async function ParentDashboardPage() {
  await requireParent();

  return <ChildDashboard />;
}
