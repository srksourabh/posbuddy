import { createClient } from "@/lib/supabase/server";
import { MasterTable } from "@/components/master/master-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export default async function BanksPage() {
  const supabase = await createClient();
  const { data }: AnyQuery = await supabase
    .from("acquiring_banks")
    .select("*")
    .order("bank_name");

  const rows = (data ?? []) as {
    bank_id: number;
    bank_name: string;
    bank_code: string | null;
    is_active: boolean;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Acquiring Banks</h1>
        <p className="text-muted-foreground">
          Manage acquiring bank records.
        </p>
      </div>
      <MasterTable
        columns={[
          { key: "bank_id", label: "ID" },
          { key: "bank_name", label: "Name" },
          { key: "bank_code", label: "Code" },
          { key: "is_active", label: "Active", type: "boolean" },
        ]}
        rows={rows}
        idKey="bank_id"
      />
    </div>
  );
}
