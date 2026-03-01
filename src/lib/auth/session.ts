import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type StaffRow = Database["public"]["Tables"]["pos_staff"]["Row"];

export interface AuthUser {
  user: {
    id: string;
    email: string | undefined;
  };
  staff: StaffRow;
}

/**
 * Gets the current authenticated user and their linked pos_staff record.
 * Returns null if not authenticated or no staff record found.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Use .filter() to avoid Supabase strict type narrowing on nullable columns
  const { data: staffRows } = await supabase
    .from("pos_staff")
    .select("*")
    .filter("auth_user_id", "eq", user.id)
    .eq("is_active", true)
    .limit(1);

  const staff = (staffRows as StaffRow[] | null)?.[0];
  if (!staff) return null;

  return {
    user: { id: user.id, email: user.email },
    staff,
  };
}

/**
 * Requires authentication. Redirects to /login if not authenticated.
 */
export async function requireAuth(): Promise<AuthUser> {
  const authUser = await getCurrentUser();
  if (!authUser) redirect("/login");
  return authUser;
}

/**
 * Requires Back Office, Stock, or Management department.
 * Redirects FSE users to /my-calls.
 */
export async function requireBackOffice(): Promise<AuthUser> {
  const authUser = await requireAuth();
  if (authUser.staff.department === "FSE") redirect("/my-calls");
  return authUser;
}

/**
 * Requires FSE department.
 * Redirects non-FSE users to /dashboard.
 */
export async function requireFSE(): Promise<AuthUser> {
  const authUser = await requireAuth();
  if (authUser.staff.department !== "FSE") redirect("/dashboard");
  return authUser;
}
