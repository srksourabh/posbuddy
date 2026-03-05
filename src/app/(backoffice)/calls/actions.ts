"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { flattenRow, buildStaffMap, sanitizeError } from "@/lib/helpers";

type CallRow = Database["public"]["Tables"]["calls"]["Row"];

export interface CallsFilter {
  status?: string;
  customerId?: number;
  assignedToId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CallWithRelations extends CallRow {
  customer_name?: string;
  customer_code?: string;
  call_type_name?: string;
  bank_name?: string;
  device_model_name?: string;
  assigned_to_name?: string;
  assigned_by_name?: string;
}

export interface CallsListResult {
  calls: CallWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

// Helper: Supabase generated types narrow to `never` on many chained ops.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export async function fetchCalls(
  filters: CallsFilter = {}
): Promise<CallsListResult> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query: AnyQuery = supabase
    .from("calls")
    .select(
      `
      *,
      customers!inner ( customer_name, customer_code ),
      call_types ( call_type_name ),
      acquiring_banks ( bank_name ),
      device_models ( model_name )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status && filters.status !== "all") {
    query = query.eq("call_status", filters.status);
  }
  if (filters.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }
  if (filters.assignedToId) {
    query = query.eq("assigned_to_id", filters.assignedToId);
  }
  if (filters.search) {
    query = query.or(
      `call_ticket_number.ilike.%${filters.search}%,merchant_name.ilike.%${filters.search}%,mid.ilike.%${filters.search}%,tid.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) throw new Error(error.message);

  // Collect unique assigned_to_id values to batch-fetch staff names
  const rows = (data ?? []) as Record<string, unknown>[];
  const assignedIds = [
    ...new Set(
      rows
        .map((r) => r.assigned_to_id as number | null)
        .filter((id): id is number => id != null)
    ),
  ];

  let staffMap: Record<number, string> = {};
  if (assignedIds.length > 0) {
    const { data: staffRows } = await supabase
      .from("pos_staff")
      .select("staff_id, full_name")
      .in("staff_id", assignedIds) as AnyQuery;
    staffMap = buildStaffMap((staffRows ?? []) as { staff_id: number; full_name: string | null }[]);
  }

  const relationKeys = ["customers", "call_types", "acquiring_banks", "device_models"];
  const calls: CallWithRelations[] = rows.map((row) => {
    const customers = row.customers as { customer_name: string; customer_code: string } | null;
    const call_types = row.call_types as { call_type_name: string } | null;
    const acquiring_banks = row.acquiring_banks as { bank_name: string } | null;
    const device_models = row.device_models as { model_name: string } | null;
    const assignedToId = row.assigned_to_id as number | null;

    return flattenRow<CallWithRelations>(row, relationKeys, {
      customer_name: customers?.customer_name,
      customer_code: customers?.customer_code,
      call_type_name: call_types?.call_type_name,
      bank_name: acquiring_banks?.bank_name,
      device_model_name: device_models?.model_name,
      assigned_to_name: assignedToId ? staffMap[assignedToId] : undefined,
    });
  });

  return { calls, total: count ?? 0, page, pageSize };
}

export async function fetchCallById(
  callId: number
): Promise<CallWithRelations | null> {
  const supabase = await createClient();

  const { data, error }: AnyQuery = await supabase
    .from("calls")
    .select(
      `
      *,
      customers ( customer_name, customer_code ),
      call_types ( call_type_name ),
      acquiring_banks ( bank_name ),
      device_models ( model_name )
    `
    )
    .eq("call_id", callId)
    .limit(1);

  const rows = (data ?? []) as Record<string, unknown>[];
  if (error || rows.length === 0) return null;

  const row = rows[0];
  const customers = row.customers as { customer_name: string; customer_code: string } | null;
  const call_types = row.call_types as { call_type_name: string } | null;
  const acquiring_banks = row.acquiring_banks as { bank_name: string } | null;
  const device_models = row.device_models as { model_name: string } | null;

  return flattenRow<CallWithRelations>(row, ["customers", "call_types", "acquiring_banks", "device_models"], {
    customer_name: customers?.customer_name,
    customer_code: customers?.customer_code,
    call_type_name: call_types?.call_type_name,
    bank_name: acquiring_banks?.bank_name,
    device_model_name: device_models?.model_name,
  });
}

export async function fetchStaffForAssignment() {
  const supabase = await createClient();

  const { data, error }: AnyQuery = await supabase
    .from("pos_staff")
    .select("staff_id, full_name, phone, department, city, state")
    .eq("is_active", true)
    .eq("department", "FSE")
    .order("full_name");

  if (error) throw new Error(error.message);
  return (data ?? []) as {
    staff_id: number;
    full_name: string | null;
    phone: string | null;
    department: string | null;
    city: string | null;
    state: string | null;
  }[];
}

export async function assignCall(callId: number, assignedToId: number) {
  const supabase = await createClient();

  const { data: staffId } = await supabase.rpc("get_current_staff_id");

  // Get current call status for the log
  const { data: currentCallData }: AnyQuery = await supabase
    .from("calls")
    .select("call_status")
    .eq("call_id", callId)
    .limit(1);

  const currentCall = ((currentCallData ?? []) as { call_status: string }[])[0];
  const oldStatus = currentCall?.call_status ?? "Pending";
  const newStatus = "Assigned";

  const { error } = await (supabase.from("calls") as AnyQuery)
    .update({
      assigned_to_id: assignedToId,
      assigned_by_id: staffId,
      assigned_at: new Date().toISOString(),
      call_status: newStatus,
    })
    .eq("call_id", callId);

  if (error) return { error: sanitizeError(error) };

  await (supabase.from("call_status_log") as AnyQuery).insert({
    call_id: callId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by_id: staffId,
    change_reason: "Call assigned to FSE",
  });

  revalidatePath("/calls");
  return { success: true };
}

export async function bulkAssignCalls(
  callIds: number[],
  assignedToId: number
) {
  const results = await Promise.all(
    callIds.map((id) => assignCall(id, assignedToId))
  );
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return { error: `Failed to assign ${errors.length} of ${callIds.length} calls` };
  }
  return { success: true };
}

export async function updateCallStatus(
  callId: number,
  newStatus: string,
  reason?: string
) {
  const supabase = await createClient();

  const { data: staffId } = await supabase.rpc("get_current_staff_id");

  const { data: currentCallRows }: AnyQuery = await supabase
    .from("calls")
    .select("call_status")
    .eq("call_id", callId)
    .limit(1);

  const currentCallRow = ((currentCallRows ?? []) as { call_status: string }[])[0];
  const oldStatus = currentCallRow?.call_status ?? "Pending";

  const { error } = await (supabase.from("calls") as AnyQuery)
    .update({ call_status: newStatus })
    .eq("call_id", callId);

  if (error) return { error: sanitizeError(error) };

  await (supabase.from("call_status_log") as AnyQuery).insert({
    call_id: callId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by_id: staffId,
    change_reason: reason ?? `Status changed to ${newStatus}`,
  });

  revalidatePath("/calls");
  revalidatePath(`/calls/${callId}`);
  return { success: true };
}

export async function fetchCustomers() {
  const supabase = await createClient();
  const { data }: AnyQuery = await supabase
    .from("customers")
    .select("customer_id, customer_name, customer_code")
    .eq("is_active", true)
    .order("customer_name");
  return (data ?? []) as {
    customer_id: number;
    customer_name: string;
    customer_code: string;
  }[];
}

export async function fetchCallHistory(callId: number) {
  const supabase = await createClient();
  const { data }: AnyQuery = await supabase
    .from("call_status_log")
    .select("*")
    .eq("call_id", callId)
    .order("changed_at", { ascending: false });
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

export async function fetchAssignedStaffName(staffId: number) {
  const supabase = await createClient();
  const { data }: AnyQuery = await supabase
    .from("pos_staff")
    .select("full_name, phone")
    .eq("staff_id", staffId)
    .limit(1);
  const rows = (data ?? []) as { full_name: string | null; phone: string | null }[];
  return rows[0] ?? null;
}
