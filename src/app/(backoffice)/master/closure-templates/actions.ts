"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export interface TemplateField {
  template_field_id: number;
  customer_id: number;
  field_name: string | null;
  field_type: string | null;
  is_required: boolean;
  display_order: number | null;
  options_json: string[] | null;
  is_active: boolean;
}

export async function fetchTemplatesForCustomer(
  customerId: number
): Promise<TemplateField[]> {
  const supabase = await createClient();

  const { data, error }: AnyQuery = await supabase
    .from("closing_requirement_templates")
    .select("*")
    .eq("customer_id", customerId)
    .eq("is_active", true)
    .order("display_order");

  if (error) throw new Error(error.message);
  return (data ?? []) as TemplateField[];
}

export async function saveTemplateField(field: {
  template_field_id?: number;
  customer_id: number;
  field_name: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  options_json?: string[] | null;
}) {
  const supabase = await createClient();

  if (field.template_field_id) {
    // Update existing
    const { error }: AnyQuery = await (
      supabase.from("closing_requirement_templates") as AnyQuery
    )
      .update({
        field_name: field.field_name,
        field_type: field.field_type,
        is_required: field.is_required,
        display_order: field.display_order,
        options_json: field.options_json ?? null,
      })
      .eq("template_field_id", field.template_field_id);

    if (error) return { error: error.message };
  } else {
    // Insert new
    const { error }: AnyQuery = await (
      supabase.from("closing_requirement_templates") as AnyQuery
    ).insert({
      customer_id: field.customer_id,
      field_name: field.field_name,
      field_type: field.field_type,
      is_required: field.is_required,
      display_order: field.display_order,
      options_json: field.options_json ?? null,
    });

    if (error) return { error: error.message };
  }

  revalidatePath("/master/closure-templates");
  return { success: true };
}

export async function deleteTemplateField(templateFieldId: number) {
  const supabase = await createClient();

  const { error }: AnyQuery = await (
    supabase.from("closing_requirement_templates") as AnyQuery
  )
    .update({ is_active: false })
    .eq("template_field_id", templateFieldId);

  if (error) return { error: error.message };

  revalidatePath("/master/closure-templates");
  return { success: true };
}

export async function reorderTemplateFields(
  updates: { template_field_id: number; display_order: number }[]
) {
  const supabase = await createClient();

  for (const u of updates) {
    const { error }: AnyQuery = await (
      supabase.from("closing_requirement_templates") as AnyQuery
    )
      .update({ display_order: u.display_order })
      .eq("template_field_id", u.template_field_id);

    if (error) return { error: error.message };
  }

  revalidatePath("/master/closure-templates");
  return { success: true };
}

export async function fetchCustomersForTemplates() {
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
