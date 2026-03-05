"use server";

import { createClient } from "@/lib/supabase/server";
import { buildStaffMap } from "@/lib/helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export interface TeamFSE {
  staff_id: number;
  full_name: string | null;
  phone: string | null;
  designation: string | null;
  city: string | null;
  state: string | null;
  open_calls: number;
  in_progress_calls: number;
}

export interface PendingCall {
  call_id: number;
  call_ticket_number: string;
  customer_name: string | null;
  customer_code: string | null;
  call_type_name: string | null;
  merchant_name: string | null;
  city: string | null;
  state: string | null;
  created_at: string;
}

export async function fetchMyTeamFSEs(): Promise<TeamFSE[]> {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");

  if (!staffId) return [];

  // Get all FSEs reporting to current user (direct reports)
  const { data: downlineIds }: AnyQuery = await supabase.rpc("get_downline_staff_ids", {
    manager_staff_id: staffId,
  } as AnyQuery);

  const fseIds = (downlineIds ?? []) as number[];
  if (fseIds.length === 0) {
    // If no downline via recursive function, get direct reports
    const { data: directReports }: AnyQuery = await supabase
      .from("pos_staff")
      .select("staff_id, full_name, phone, designation, city, state")
      .eq("reports_to_id", staffId)
      .eq("department", "FSE")
      .eq("is_active", true);

    if (!directReports || directReports.length === 0) return [];

    return await enrichFSEsWithCallCounts(
      supabase,
      directReports as TeamFSE[]
    );
  }

  const { data: fseRows }: AnyQuery = await supabase
    .from("pos_staff")
    .select("staff_id, full_name, phone, designation, city, state")
    .in("staff_id", fseIds)
    .eq("department", "FSE")
    .eq("is_active", true);

  if (!fseRows || fseRows.length === 0) return [];

  return await enrichFSEsWithCallCounts(supabase, fseRows as TeamFSE[]);
}

async function enrichFSEsWithCallCounts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  fses: TeamFSE[]
): Promise<TeamFSE[]> {
  const fseIds = fses.map((f) => f.staff_id);

  // Get call counts for each FSE
  const { data: callData }: AnyQuery = await supabase
    .from("calls")
    .select("assigned_to_id, call_status")
    .in("assigned_to_id", fseIds)
    .in("call_status", ["Assigned", "In Progress"]);

  const calls = (callData ?? []) as {
    assigned_to_id: number;
    call_status: string;
  }[];

  return fses.map((fse) => {
    const fseCalls = calls.filter((c) => c.assigned_to_id === fse.staff_id);
    return {
      ...fse,
      open_calls: fseCalls.length,
      in_progress_calls: fseCalls.filter((c) => c.call_status === "In Progress")
        .length,
    };
  });
}

export async function fetchPendingCalls(): Promise<PendingCall[]> {
  const supabase = await createClient();

  const { data }: AnyQuery = await supabase
    .from("calls")
    .select(
      `
      call_id, call_ticket_number, merchant_name, city, state, created_at,
      customers ( customer_name, customer_code ),
      call_types ( call_type_name )
    `
    )
    .eq("call_status", "Pending")
    .order("created_at", { ascending: true })
    .limit(100);

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((row) => {
    const customers = row.customers as {
      customer_name: string;
      customer_code: string;
    } | null;
    const call_types = row.call_types as { call_type_name: string } | null;

    return {
      call_id: row.call_id as number,
      call_ticket_number: row.call_ticket_number as string,
      customer_name: customers?.customer_name ?? null,
      customer_code: customers?.customer_code ?? null,
      call_type_name: call_types?.call_type_name ?? null,
      merchant_name: row.merchant_name as string | null,
      city: row.city as string | null,
      state: row.state as string | null,
      created_at: row.created_at as string,
    };
  });
}

export async function fetchTeamActivityLog() {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");
  if (!staffId) return [];

  // Get downline staff IDs
  const { data: downlineIds }: AnyQuery = await supabase.rpc("get_downline_staff_ids", {
    manager_staff_id: staffId,
  } as AnyQuery);

  const allIds = [...((downlineIds ?? []) as number[]), staffId];

  const { data }: AnyQuery = await supabase
    .from("call_status_log")
    .select(
      `
      log_id, call_id, old_status, new_status, change_reason, changed_at, changed_by_id
    `
    )
    .in("changed_by_id", allIds)
    .order("changed_at", { ascending: false })
    .limit(20);

  const logs = (data ?? []) as {
    log_id: number;
    call_id: number;
    old_status: string | null;
    new_status: string | null;
    change_reason: string | null;
    changed_at: string;
    changed_by_id: number | null;
  }[];

  // Fetch staff names
  const staffIds = [
    ...new Set(logs.map((l) => l.changed_by_id).filter(Boolean)),
  ] as number[];
  let staffMap: Record<number, string> = {};
  if (staffIds.length > 0) {
    const { data: staffRows }: AnyQuery = await supabase
      .from("pos_staff")
      .select("staff_id, full_name")
      .in("staff_id", staffIds);
    staffMap = buildStaffMap((staffRows ?? []) as { staff_id: number; full_name: string | null }[]);
  }

  // Fetch call ticket numbers
  const callIds = [...new Set(logs.map((l) => l.call_id))];
  let callMap: Record<number, string> = {};
  if (callIds.length > 0) {
    const { data: callRows }: AnyQuery = await supabase
      .from("calls")
      .select("call_id, call_ticket_number")
      .in("call_id", callIds);
    callMap = Object.fromEntries(
      (
        (callRows ?? []) as { call_id: number; call_ticket_number: string }[]
      ).map((c) => [c.call_id, c.call_ticket_number])
    );
  }

  return logs.map((log) => ({
    ...log,
    changed_by_name: log.changed_by_id
      ? staffMap[log.changed_by_id] ?? "Unknown"
      : "Unknown",
    call_ticket_number: callMap[log.call_id] ?? `#${log.call_id}`,
  }));
}

export interface TeamCallStats {
  total: number;
  pending: number;
  assigned: number;
  inProgress: number;
  closed: number;
}

export async function fetchTeamCallStats(): Promise<TeamCallStats> {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");
  if (!staffId) return { total: 0, pending: 0, assigned: 0, inProgress: 0, closed: 0 };

  const { data: downlineIds }: AnyQuery = await supabase.rpc("get_downline_staff_ids", {
    manager_staff_id: staffId,
  } as AnyQuery);

  const fseIds = (downlineIds ?? []) as number[];

  // Get pending calls (unassigned)
  const { count: pendingCount }: AnyQuery = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true })
    .eq("call_status", "Pending");

  if (fseIds.length === 0) {
    return {
      total: pendingCount ?? 0,
      pending: pendingCount ?? 0,
      assigned: 0,
      inProgress: 0,
      closed: 0,
    };
  }

  // Get team calls
  const { data: teamCalls }: AnyQuery = await supabase
    .from("calls")
    .select("call_status")
    .in("assigned_to_id", fseIds);

  const calls = (teamCalls ?? []) as { call_status: string }[];
  const assigned = calls.filter((c) => c.call_status === "Assigned").length;
  const inProgress = calls.filter(
    (c) => c.call_status === "In Progress"
  ).length;
  const closed = calls.filter((c) => c.call_status === "Closed").length;

  return {
    total: (pendingCount ?? 0) + calls.length,
    pending: pendingCount ?? 0,
    assigned,
    inProgress,
    closed,
  };
}
