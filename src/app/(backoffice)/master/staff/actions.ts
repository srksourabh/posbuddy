"use server";

import { revalidatePath } from "next/cache";
import { createUdsHrClient } from "@/lib/supabase/uds-hr";
import { createAdminClient } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

/** Shape of an HR employee returned to the client for preview */
export interface HREmployee {
  id: string;
  employee_code: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  designation: string | null;
  department: string | null;
  city: string | null;
  deactivated_at: string | null;
}

/**
 * Fetches all employees from UDS-HR's hr_profiles table.
 * Returns a preview list for the sync dialog.
 */
export async function fetchHREmployees(): Promise<{
  employees: HREmployee[];
  error?: string;
}> {
  try {
    const hr = createUdsHrClient();

    const { data, error } = await hr
      .from("hr_profiles")
      .select(
        "id, employee_code, full_name, phone, email, designation, department, city, deactivated_at"
      )
      .order("full_name");

    if (error) {
      return { employees: [], error: error.message };
    }

    return { employees: (data ?? []) as HREmployee[] };
  } catch (err) {
    return {
      employees: [],
      error: err instanceof Error ? err.message : "Failed to connect to HR system",
    };
  }
}

/**
 * Syncs selected HR employees into pos_staff.
 * Uses upsert on hr_user_id so re-syncing updates existing records.
 */
export async function syncFromHR(
  selectedIds: string[]
): Promise<{ synced: number; errors: string[] }> {
  if (selectedIds.length === 0) {
    return { synced: 0, errors: ["No employees selected"] };
  }

  const hr = createUdsHrClient();
  const admin = createAdminClient();
  const errors: string[] = [];
  let synced = 0;

  // Fetch full profile data for selected employees
  const { data: hrData, error: hrError } = await hr
    .from("hr_profiles")
    .select(
      "id, employee_code, full_name, phone, email, avatar_url, designation, department, address, city, state, pincode, date_of_joining, deactivated_at"
    )
    .in("id", selectedIds);

  if (hrError) {
    return { synced: 0, errors: [hrError.message] };
  }

  const employees = (hrData ?? []) as {
    id: string;
    employee_code: string | null;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
    designation: string | null;
    department: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    date_of_joining: string | null;
    deactivated_at: string | null;
  }[];

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < employees.length; i += BATCH_SIZE) {
    const batch = employees.slice(i, i + BATCH_SIZE);

    const staffRows = batch.map((emp) => ({
      hr_user_id: emp.id,
      hr_emp_code: emp.employee_code,
      full_name: emp.full_name,
      phone: emp.phone,
      email: emp.email,
      avatar_url: emp.avatar_url,
      designation: emp.designation,
      department: emp.department,
      address: emp.address,
      city: emp.city,
      state: emp.state,
      pincode: emp.pincode,
      date_of_joining: emp.date_of_joining,
      deactivated_at: emp.deactivated_at,
      is_active: emp.deactivated_at == null,
      last_synced_at: new Date().toISOString(),
    }));

    const { error }: AnyQuery = await (admin.from("pos_staff") as AnyQuery)
      .upsert(staffRows, { onConflict: "hr_user_id" });

    if (error) {
      errors.push(
        `Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`
      );
    } else {
      synced += staffRows.length;
    }
  }

  revalidatePath("/master/staff");
  return { synced, errors };
}
