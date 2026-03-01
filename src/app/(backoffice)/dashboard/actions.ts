"use server";

import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export interface DashboardStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  closed: number;
  cancelled: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface CustomerBreakdown {
  customer_name: string;
  count: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const statuses = ["Pending", "Assigned", "In Progress", "Closed", "Cancelled"];
  const counts: Record<string, number> = {};

  // Get total count
  const { count: totalCount }: AnyQuery = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true });

  // Get count per status
  for (const status of statuses) {
    const { count }: AnyQuery = await supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("call_status", status);
    counts[status] = count ?? 0;
  }

  return {
    total: totalCount ?? 0,
    pending: counts["Pending"] ?? 0,
    assigned: counts["Assigned"] ?? 0,
    inProgress: counts["In Progress"] ?? 0,
    closed: counts["Closed"] ?? 0,
    cancelled: counts["Cancelled"] ?? 0,
  };
}

export async function fetchCustomerBreakdown(): Promise<CustomerBreakdown[]> {
  const supabase = await createClient();

  // Get calls grouped by customer using a raw count approach
  const { data }: AnyQuery = await supabase
    .from("calls")
    .select("customer_id, customers ( customer_name )");

  const rows = (data ?? []) as {
    customer_id: number;
    customers: { customer_name: string } | null;
  }[];

  // Group and count
  const grouped = new Map<string, number>();
  for (const row of rows) {
    const name = row.customers?.customer_name ?? "Unknown";
    grouped.set(name, (grouped.get(name) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([customer_name, count]) => ({ customer_name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchRecentActivity() {
  const supabase = await createClient();

  const { data }: AnyQuery = await supabase
    .from("call_status_log")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(10);

  return (data ?? []) as {
    log_id: number;
    call_id: number;
    old_status: string | null;
    new_status: string | null;
    changed_by_id: number | null;
    change_reason: string | null;
    changed_at: string;
  }[];
}
