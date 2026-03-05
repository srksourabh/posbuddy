"use server";

import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export interface CustomerCallCount {
  customer_name: string;
  customer_code: string;
  count: number;
}

export interface FSEClosureRate {
  staff_id: number;
  full_name: string;
  total: number;
  closed: number;
  rate: number; // 0-100
}

export async function fetchTeamCustomerBreakdown(): Promise<CustomerCallCount[]> {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");
  if (!staffId) return [];

  const { data: downlineIds }: AnyQuery = await supabase.rpc(
    "get_downline_staff_ids",
    { manager_staff_id: staffId } as AnyQuery
  );
  const fseIds = (downlineIds ?? []) as number[];
  if (fseIds.length === 0) return [];

  // Get team calls with customer info
  const { data: calls }: AnyQuery = await supabase
    .from("calls")
    .select("customer_id, customers ( customer_name, customer_code )")
    .in("assigned_to_id", fseIds);

  const rows = (calls ?? []) as Record<string, unknown>[];
  const counts: Record<number, { name: string; code: string; count: number }> = {};

  for (const row of rows) {
    const custId = row.customer_id as number;
    const cust = row.customers as {
      customer_name: string;
      customer_code: string;
    } | null;
    if (!counts[custId]) {
      counts[custId] = {
        name: cust?.customer_name ?? "Unknown",
        code: cust?.customer_code ?? "?",
        count: 0,
      };
    }
    counts[custId].count++;
  }

  return Object.values(counts)
    .map((c) => ({
      customer_name: c.name,
      customer_code: c.code,
      count: c.count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function fetchFSEClosureRates(): Promise<FSEClosureRate[]> {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");
  if (!staffId) return [];

  const { data: downlineIds }: AnyQuery = await supabase.rpc(
    "get_downline_staff_ids",
    { manager_staff_id: staffId } as AnyQuery
  );
  const fseIds = (downlineIds ?? []) as number[];
  if (fseIds.length === 0) return [];

  // Get FSE names
  const { data: fseRows }: AnyQuery = await supabase
    .from("pos_staff")
    .select("staff_id, full_name")
    .in("staff_id", fseIds)
    .eq("department", "FSE")
    .eq("is_active", true);

  const fses = (fseRows ?? []) as { staff_id: number; full_name: string | null }[];

  // Get all calls for these FSEs
  const { data: callData }: AnyQuery = await supabase
    .from("calls")
    .select("assigned_to_id, call_status")
    .in("assigned_to_id", fseIds);

  const calls = (callData ?? []) as {
    assigned_to_id: number;
    call_status: string;
  }[];

  return fses.map((f) => {
    const fseCalls = calls.filter((c) => c.assigned_to_id === f.staff_id);
    const total = fseCalls.length;
    const closed = fseCalls.filter((c) => c.call_status === "Closed").length;
    return {
      staff_id: f.staff_id,
      full_name: f.full_name ?? "Unknown",
      total,
      closed,
      rate: total > 0 ? Math.round((closed / total) * 100) : 0,
    };
  });
}
