import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";

export default async function AdminPage() {
  // Guard: only admin users can access this page
  await requireAdmin();
  // Redirect to dashboard - the admin sees all admin-only nav items
  redirect("/dashboard");
}
