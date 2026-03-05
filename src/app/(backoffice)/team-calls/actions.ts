"use server";

import { createClient } from "@/lib/supabase/server";
import { buildStaffMap } from "@/lib/helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export interface TeamCall {
  call_id: number;
  call_ticket_number: string;
  customer_name: string | null;
  customer_code: string | null;
  call_type_name: string | null;
  merchant_name: string | null;
  city: string | null;
  state: string | null;
  call_status: string;
  assigned_to_name: string | null;
  assigned_to_id: number | null;
  customer_id: number;
  created_at: string;
}

export interface TeamCallsFilter {
  search?: string;
  customerId?: number;
  status?: string;
  fseId?: number;
}

export async function fetchTeamCalls(
  filters: TeamCallsFilter = {}
): Promise<TeamCall[]> {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");
  if (!staffId) return [];

  // Get downline FSE IDs
  const { data: downlineIds }: AnyQuery = await supabase.rpc(
    "get_downline_staff_ids",
    { manager_staff_id: staffId } as AnyQuery
  );

  const fseIds = (downlineIds ?? []) as number[];

  // If no downline, try direct reports
  let effectiveIds = fseIds;
  if (effectiveIds.length === 0) {
    const { data: directReports }: AnyQuery = await supabase
      .from("pos_staff")
      .select("staff_id")
      .eq("reports_to_id", staffId)
      .eq("department", "FSE")
      .eq("is_active", true);
    effectiveIds = ((directReports ?? []) as { staff_id: number }[]).map(
      (r) => r.staff_id
    );
  }

  // Build query - include pending (unassigned) + calls assigned to team FSEs
  let query: AnyQuery = supabase
    .from("calls")
    .select(
      `
      call_id, call_ticket_number, merchant_name, city, state, call_status,
      assigned_to_id, customer_id, created_at,
      customers ( customer_name, customer_code ),
      call_types ( call_type_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  // Filter by FSE if specified
  if (filters.fseId) {
    query = query.eq("assigned_to_id", filters.fseId);
  } else if (effectiveIds.length > 0) {
    // Show pending calls + calls assigned to team
    query = query.or(
      `call_status.eq.Pending,assigned_to_id.in.(${effectiveIds.join(",")})`
    );
  } else {
    query = query.eq("call_status", "Pending");
  }

  if (filters.status) {
    query = query.eq("call_status", filters.status);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.search) {
    query = query.or(
      `call_ticket_number.ilike.%${filters.search}%,merchant_name.ilike.%${filters.search}%`
    );
  }

  const { data } = await query;
  const rows = (data ?? []) as Record<string, unknown>[];

  // Fetch staff names for assigned_to_id
  const assignedIds = [
    ...new Set(
      rows
        .map((r) => r.assigned_to_id as number | null)
        .filter((id): id is number => id != null)
    ),
  ];

  let staffMap: Record<number, string> = {};
  if (assignedIds.length > 0) {
    const { data: staffRows }: AnyQuery = await supabase
      .from("pos_staff")
      .select("staff_id, full_name")
      .in("staff_id", assignedIds);
    staffMap = buildStaffMap((staffRows ?? []) as { staff_id: number; full_name: string | null }[]);
  }

  return rows.map((row) => {
    const customers = row.customers as {
      customer_name: string;
      customer_code: string;
    } | null;
    const call_types = row.call_types as { call_type_name: string } | null;
    const assignedToId = row.assigned_to_id as number | null;

    return {
      call_id: row.call_id as number,
      call_ticket_number: row.call_ticket_number as string,
      customer_name: customers?.customer_name ?? null,
      customer_code: customers?.customer_code ?? null,
      call_type_name: call_types?.call_type_name ?? null,
      merchant_name: row.merchant_name as string | null,
      city: row.city as string | null,
      state: row.state as string | null,
      call_status: row.call_status as string,
      assigned_to_id: assignedToId,
      assigned_to_name: assignedToId ? staffMap[assignedToId] ?? null : null,
      customer_id: row.customer_id as number,
      created_at: row.created_at as string,
    };
  });
}

export async function fetchTeamFSEOptions(): Promise<
  { staff_id: number; full_name: string }[]
> {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");
  if (!staffId) return [];

  const { data: downlineIds }: AnyQuery = await supabase.rpc(
    "get_downline_staff_ids",
    { manager_staff_id: staffId } as AnyQuery
  );

  const fseIds = (downlineIds ?? []) as number[];
  if (fseIds.length === 0) {
    const { data: directReports }: AnyQuery = await supabase
      .from("pos_staff")
      .select("staff_id, full_name")
      .eq("reports_to_id", staffId)
      .eq("department", "FSE")
      .eq("is_active", true);
    return ((directReports ?? []) as { staff_id: number; full_name: string }[]);
  }

  const { data: fseRows }: AnyQuery = await supabase
    .from("pos_staff")
    .select("staff_id, full_name")
    .in("staff_id", fseIds)
    .eq("department", "FSE")
    .eq("is_active", true);

  return ((fseRows ?? []) as { staff_id: number; full_name: string | null }[]).map(
    (f) => ({ staff_id: f.staff_id, full_name: f.full_name ?? "Unknown" })
  );
}
