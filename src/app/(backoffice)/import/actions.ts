"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UnifiedFieldKey } from "@/lib/import/unified-fields";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export interface ColumnMapping {
  sourceColumn: string;
  unifiedField: UnifiedFieldKey;
}

export async function fetchMappingsForCustomer(customerId: number) {
  const supabase = await createClient();

  // Get the current version for this customer
  const { data: versions }: AnyQuery = await supabase
    .from("column_mapping_versions")
    .select("version_id, version_label")
    .eq("customer_id", customerId)
    .eq("is_current", true)
    .limit(1);

  const version = ((versions ?? []) as { version_id: number; version_label: string | null }[])[0];
  if (!version) return { versionId: null, mappings: [] };

  const { data: mappings }: AnyQuery = await supabase
    .from("customer_column_mappings")
    .select("mapping_id, source_column, unified_field, display_order")
    .eq("version_id", version.version_id)
    .order("display_order");

  return {
    versionId: version.version_id,
    mappings: ((mappings ?? []) as {
      mapping_id: number;
      source_column: string | null;
      unified_field: string | null;
      display_order: number | null;
    }[]).map((m) => ({
      sourceColumn: m.source_column ?? "",
      unifiedField: (m.unified_field ?? "") as UnifiedFieldKey,
    })),
  };
}

export async function saveMappings(
  customerId: number,
  mappings: ColumnMapping[]
) {
  const supabase = await createClient();
  const { data: staffId } = await supabase.rpc("get_current_staff_id");

  // Deactivate any existing current version
  await (supabase.from("column_mapping_versions") as AnyQuery)
    .update({ is_current: false })
    .eq("customer_id", customerId)
    .eq("is_current", true);

  // Create new version
  const { data: newVersion, error: versionError }: AnyQuery = await (
    supabase.from("column_mapping_versions") as AnyQuery
  ).insert({
    customer_id: customerId,
    version_label: `Mapping ${new Date().toISOString().slice(0, 10)}`,
    is_current: true,
    created_by: staffId,
  }).select("version_id").limit(1);

  if (versionError) return { error: versionError.message };

  const versionId = ((newVersion ?? []) as { version_id: number }[])[0]?.version_id;
  if (!versionId) return { error: "Failed to create mapping version" };

  // Insert mappings
  const mappingRows = mappings.map((m, idx) => ({
    version_id: versionId,
    source_column: m.sourceColumn,
    unified_field: m.unifiedField,
    display_order: idx,
  }));

  const { error: mappingError }: AnyQuery = await (
    supabase.from("customer_column_mappings") as AnyQuery
  ).insert(mappingRows);

  if (mappingError) return { error: mappingError.message };

  revalidatePath("/settings/mappings");
  return { success: true, versionId };
}

export async function importCalls(
  customerId: number,
  rows: Record<string, string>[],
  mappings: ColumnMapping[]
) {
  const supabase = await createClient();

  // Build a mapping lookup: unifiedField → sourceColumn
  const fieldMap = new Map<string, string>();
  for (const m of mappings) {
    fieldMap.set(m.unifiedField, m.sourceColumn);
  }

  const getValue = (row: Record<string, string>, field: string): string => {
    const sourceCol = fieldMap.get(field);
    if (!sourceCol) return "";
    return (row[sourceCol] ?? "").trim();
  };

  /** Parse DD/MM/YYYY or MM/DD/YYYY (with optional time) into ISO format */
  const parseDate = (raw: string): string | null => {
    if (!raw) return null;
    const m = raw.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (m) {
      let [, a, b, yyyy, hh, min, ss] = m;
      const numA = Number(a);
      const numB = Number(b);
      // Detect format: if first number > 12 it must be the day (DD/MM/YYYY)
      // If second number > 12 it must be the day (MM/DD/YYYY)
      // If both <= 12, assume DD/MM/YYYY (Indian format)
      let dd: string, mm: string;
      if (numA > 12) {
        dd = a; mm = b;
      } else if (numB > 12) {
        dd = b; mm = a;
      } else {
        dd = a; mm = b; // default DD/MM
      }
      const time = hh ? `T${hh.padStart(2, "0")}:${min}:${(ss ?? "00").padStart(2, "0")}` : "T00:00:00";
      return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}${time}`;
    }
    // Already ISO or other parseable format — return as-is
    return raw;
  };

  // Look up call types, banks, device models for name-to-id resolution
  const { data: callTypes }: AnyQuery = await supabase
    .from("call_types")
    .select("call_type_id, call_type_name");

  const { data: banks }: AnyQuery = await supabase
    .from("acquiring_banks")
    .select("bank_id, bank_name");

  const { data: devices }: AnyQuery = await supabase
    .from("device_models")
    .select("model_id, model_name");

  const callTypeMap = new Map(
    ((callTypes ?? []) as { call_type_id: number; call_type_name: string }[]).map(
      (ct) => [ct.call_type_name.toLowerCase(), ct.call_type_id]
    )
  );

  const bankMap = new Map(
    ((banks ?? []) as { bank_id: number; bank_name: string }[]).map(
      (b) => [b.bank_name.toLowerCase(), b.bank_id]
    )
  );

  const deviceMap = new Map(
    ((devices ?? []) as { model_id: number; model_name: string }[]).map(
      (d) => [d.model_name.toLowerCase(), d.model_id]
    )
  );

  const batchId = `IMP-${Date.now()}`;
  const errors: string[] = [];
  let inserted = 0;
  let duplicates = 0;

  // Collect all ticket numbers from the spreadsheet to check which already exist
  const allTickets: string[] = [];
  for (const row of rows) {
    const t = getValue(row, "call_ticket_number");
    if (t) allTickets.push(t);
  }

  // Fetch existing ticket numbers in batches to build a set
  const existingTickets = new Set<string>();
  const LOOKUP_BATCH = 500;
  for (let i = 0; i < allTickets.length; i += LOOKUP_BATCH) {
    const slice = allTickets.slice(i, i + LOOKUP_BATCH);
    const { data: found }: AnyQuery = await supabase
      .from("calls")
      .select("call_ticket_number")
      .in("call_ticket_number", slice);
    for (const r of (found ?? []) as { call_ticket_number: string }[]) {
      existingTickets.add(r.call_ticket_number);
    }
  }

  // Process rows in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const callRows = batch.map((row, idx) => {
      const ticketNumber = getValue(row, "call_ticket_number");
      if (!ticketNumber) {
        errors.push(`Row ${i + idx + 2}: Missing ticket number`);
        return null;
      }

      // Skip duplicates (already in DB or seen earlier in this spreadsheet)
      if (existingTickets.has(ticketNumber)) {
        return "duplicate";
      }
      // Mark as seen so later rows with same ticket are also skipped
      existingTickets.add(ticketNumber);

      const callTypeName = getValue(row, "call_type");
      const bankName = getValue(row, "acquiring_bank");
      const deviceName = getValue(row, "device_model");

      return {
        customer_id: customerId,
        call_ticket_number: ticketNumber,
        call_type_id: callTypeName
          ? callTypeMap.get(callTypeName.toLowerCase()) ?? null
          : null,
        call_creation_date: parseDate(getValue(row, "call_creation_date")),
        merchant_name: getValue(row, "merchant_name") || null,
        mid: getValue(row, "mid") || null,
        tid: getValue(row, "tid") || null,
        acquiring_bank_id: bankName
          ? bankMap.get(bankName.toLowerCase()) ?? null
          : null,
        contact_address: getValue(row, "contact_address") || null,
        city: getValue(row, "city") || null,
        district: getValue(row, "district") || null,
        state: getValue(row, "state") || null,
        pincode: getValue(row, "pincode") || null,
        contact_name: getValue(row, "contact_name") || null,
        contact_phone: getValue(row, "contact_phone") || null,
        device_model_id: deviceName
          ? deviceMap.get(deviceName.toLowerCase()) ?? null
          : null,
        problem_description: getValue(row, "problem_description") || null,
        call_status: "Pending",
        source_raw_data: row,
        import_batch_id: batchId,
      };
    });

    // Count and remove duplicates, then filter nulls
    const dupsInBatch = callRows.filter((r) => r === "duplicate").length;
    duplicates += dupsInBatch;

    const newRows = callRows.filter(
      (r): r is Exclude<NonNullable<typeof r>, string> =>
        r != null && r !== "duplicate"
    );

    if (newRows.length > 0) {
      const { error }: AnyQuery = await (supabase.from("calls") as AnyQuery)
        .upsert(newRows, { onConflict: "call_ticket_number", ignoreDuplicates: true });

      if (error) {
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        inserted += newRows.length;
      }
    }
  }

  revalidatePath("/calls");
  return { inserted, duplicates, errors, batchId, total: rows.length };
}
