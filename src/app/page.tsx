import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/select-role");
  redirect(session.role === "parent" ? "/parent" : "/clinic");
}
