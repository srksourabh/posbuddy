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

  // Single query: fetch all call statuses and count in JS
  const { data }: AnyQuery = await supabase
    .from("calls")
    .select("call_status");

  const rows = (data ?? []) as { call_status: string }[];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.call_status] = (counts[row.call_status] ?? 0) + 1;
  }

  return {
    total: rows.length,
    pending: counts["Pending"] ?? 0,
    assigned: counts["Assigned"] ?? 0,
    inProgress: counts["In Progress"] ?? 0,
    closed: counts["Closed"] ?? 0,
    cancelled: counts["Cancelled"] ?? 0,
  };
}

export async function fetchCustomerBreakdown(): Promise<CustomerBreakdown[]> {
  const supabase = await createClient();

  // Fetch all customers first
  const { data: customers }: AnyQuery = await supabase
    .from("customers")
    .select("customer_id, customer_name");

  const customerList = (customers ?? []) as {
    customer_id: number;
    customer_name: string;
  }[];

  // Get count per customer using exact count (no row limit)
  const results: CustomerBreakdown[] = [];
  for (const c of customerList) {
    const { count }: AnyQuery = await supabase
      .from("calls")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", c.customer_id);
    if (count && count > 0) {
      results.push({ customer_name: c.customer_name, count });
    }
  }

  return results.sort((a, b) => b.count - a.count);
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
