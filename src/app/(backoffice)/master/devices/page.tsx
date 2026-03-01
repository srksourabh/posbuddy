import { createClient } from "@/lib/supabase/server";
import { MasterTable } from "@/components/master/master-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export default async function DevicesPage() {
  const supabase = await createClient();
  const { data }: AnyQuery = await supabase
    .from("device_models")
    .select("*")
    .order("model_name");

  const rows = (data ?? []) as {
    model_id: number;
    model_name: string;
    is_active: boolean;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Device Models</h1>
        <p className="text-muted-foreground">
          Manage POS terminal device models.
        </p>
      </div>
      <MasterTable
        columns={[
          { key: "model_id", label: "ID" },
          { key: "model_name", label: "Model Name" },
          { key: "is_active", label: "Active", type: "boolean" },
        ]}
        rows={rows}
        idKey="model_id"
      />
    </div>
  );
}
