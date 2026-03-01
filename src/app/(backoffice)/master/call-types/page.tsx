import { createClient } from "@/lib/supabase/server";
import { MasterTable } from "@/components/master/master-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export default async function CallTypesPage() {
  const supabase = await createClient();
  const { data }: AnyQuery = await supabase
    .from("call_types")
    .select("*")
    .order("call_type_name");

  const rows = (data ?? []) as {
    call_type_id: number;
    call_type_name: string;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Call Types</h1>
        <p className="text-muted-foreground">
          View service call type definitions.
        </p>
      </div>
      <MasterTable
        columns={[
          { key: "call_type_id", label: "ID" },
          { key: "call_type_name", label: "Call Type" },
        ]}
        rows={rows}
        idKey="call_type_id"
      />
    </div>
  );
}
