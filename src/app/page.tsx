import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/select-role");
  if (session.role === "parent") redirect("/parent");
  if (session.role === "pharmacy") redirect("/pharmacy");
  redirect("/clinic");
}
