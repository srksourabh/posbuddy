import { createClient } from "@/lib/supabase/server";
import { MasterTable } from "@/components/master/master-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data }: AnyQuery = await supabase
    .from("customers")
    .select("*")
    .order("customer_name");

  const rows = (data ?? []) as {
    customer_id: number;
    customer_name: string;
    customer_code: string;
    is_active: boolean;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <p className="text-muted-foreground">
          Manage customer organizations.
        </p>
      </div>
      <MasterTable
        columns={[
          { key: "customer_id", label: "ID" },
          { key: "customer_name", label: "Name" },
          { key: "customer_code", label: "Code" },
          { key: "is_active", label: "Active", type: "boolean" },
        ]}
        rows={rows}
        idKey="customer_id"
      />
    </div>
  );
}
