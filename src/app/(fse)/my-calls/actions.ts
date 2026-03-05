"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type CallRow = Database["public"]["Tables"]["calls"]["Row"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export interface FseCall extends CallRow {
  customer_name?: string;
  call_type_name?: string;
  bank_name?: string;
  device_model_name?: string;
}

export async function fetchMyAssignedCalls(): Promise<FseCall[]> {
  const supabase = await createClient();

  const { data }: AnyQuery = await supabase
    .from("calls")
    .select(
      `
      *,
      customers ( customer_name ),
      call_types ( call_type_name ),
      acquiring_banks ( bank_name ),
      device_models ( model_name )
    `
    )
    .in("call_status", ["Assigned", "In Progress"])
    .order("assigned_at", { ascending: false });

  const rows = (data ?? []) as Record<string, unknown>[];

  return rows.map((row) => {
    const customers = row.customers as { customer_name: string } | null;
    const call_types = row.call_types as { call_type_name: string } | null;
    const acquiring_banks = row.acquiring_banks as { bank_name: string } | null;
    const device_models = row.device_models as { model_name: string } | null;

    const callData = Object.fromEntries(
      Object.entries(row).filter(
        ([k]) => !["customers", "call_types", "acquiring_banks", "device_models"].includes(k)
      )
    );

    return {
      ...callData,
      customer_name: customers?.customer_name,
      call_type_name: call_types?.call_type_name,
      bank_name: acquiring_banks?.bank_name,
      device_model_name: device_models?.model_name,
    } as FseCall;
  });
}

export async function startVisit(callId: number) {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");

  // Update call status to In Progress
  const { error } = await (supabase.from("calls") as AnyQuery)
    .update({ call_status: "In Progress" })
    .eq("call_id", callId);

  if (error) return { error: error.message };

  // Log status change
  await (supabase.from("call_status_log") as AnyQuery).insert({
    call_id: callId,
    old_status: "Assigned",
    new_status: "In Progress",
    changed_by_id: staffId,
    change_reason: "FSE started visit",
  });

  revalidatePath("/my-calls");
  return { success: true };
}

export interface ClosureTemplateField {
  template_field_id: number;
  field_name: string | null;
  field_type: string | null;
  is_required: boolean;
  display_order: number | null;
  options_json: string[] | null;
}

export async function fetchClosureTemplate(
  customerId: number
): Promise<ClosureTemplateField[]> {
  const supabase = await createClient();

  const { data }: AnyQuery = await supabase
    .from("closing_requirement_templates")
    .select(
      "template_field_id, field_name, field_type, is_required, display_order, options_json"
    )
    .eq("customer_id", customerId)
    .eq("is_active", true)
    .order("display_order");

  return (data ?? []) as ClosureTemplateField[];
}

export async function closeCall(
  callId: number,
  closureData: {
    closureStatus: string;
    remarks: string;
    visitInTime: string;
    visitOutTime: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    fieldValues?: { templateFieldId: number; value: string }[];
  }
) {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");

  // Insert closure record and get back the closure_id
  const { data: closureRows, error: closureError }: AnyQuery = await (
    supabase.from("call_closures") as AnyQuery
  )
    .insert({
      call_id: callId,
      closed_by_id: staffId,
      closure_status: closureData.closureStatus,
      visit_in_time: closureData.visitInTime,
      visit_out_time: closureData.visitOutTime,
      gps_latitude: closureData.gpsLatitude ?? null,
      gps_longitude: closureData.gpsLongitude ?? null,
      remarks: closureData.remarks,
    })
    .select("closure_id")
    .limit(1);

  if (closureError) return { error: closureError.message };

  const closureId = (
    (closureRows ?? []) as { closure_id: number }[]
  )[0]?.closure_id;

  // Insert dynamic field values if any
  if (closureId && closureData.fieldValues && closureData.fieldValues.length > 0) {
    const valueRows = closureData.fieldValues.map((fv) => ({
      closure_id: closureId,
      template_field_id: fv.templateFieldId,
      field_value: fv.value,
    }));

    const { error: valuesError }: AnyQuery = await (
      supabase.from("closure_field_values") as AnyQuery
    ).insert(valueRows);

    if (valuesError) return { error: valuesError.message };
  }

  // Update call status to Closed
  const { error: updateError } = await (supabase.from("calls") as AnyQuery)
    .update({ call_status: "Closed" })
    .eq("call_id", callId);

  if (updateError) return { error: updateError.message };

  // Log status change
  await (supabase.from("call_status_log") as AnyQuery).insert({
    call_id: callId,
    old_status: "In Progress",
    new_status: "Closed",
    changed_by_id: staffId,
    change_reason: `Closed: ${closureData.closureStatus}`,
  });

  revalidatePath("/my-calls");
  return { success: true };
}

export async function fetchVisitStartTime(
  callId: number
): Promise<string | null> {
  const supabase = await createClient();

  const { data }: AnyQuery = await supabase
    .from("call_status_log")
    .select("changed_at")
    .eq("call_id", callId)
    .eq("new_status", "In Progress")
    .order("changed_at", { ascending: false })
    .limit(1);

  const rows = (data ?? []) as { changed_at: string }[];
  return rows[0]?.changed_at ?? null;
}

export async function fetchCallForFse(callId: number): Promise<FseCall | null> {
  const supabase = await createClient();

  const { data }: AnyQuery = await supabase
    .from("calls")
    .select(
      `
      *,
      customers ( customer_name ),
      call_types ( call_type_name ),
      acquiring_banks ( bank_name ),
      device_models ( model_name )
    `
    )
    .eq("call_id", callId)
    .limit(1);

  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) return null;

  const row = rows[0];
  const customers = row.customers as { customer_name: string } | null;
  const call_types = row.call_types as { call_type_name: string } | null;
  const acquiring_banks = row.acquiring_banks as { bank_name: string } | null;
  const device_models = row.device_models as { model_name: string } | null;

  const callData = Object.fromEntries(
    Object.entries(row).filter(
      ([k]) => !["customers", "call_types", "acquiring_banks", "device_models"].includes(k)
    )
  );

  return {
    ...callData,
    customer_name: customers?.customer_name,
    call_type_name: call_types?.call_type_name,
    bank_name: acquiring_banks?.bank_name,
    device_model_name: device_models?.model_name,
  } as FseCall;
}
