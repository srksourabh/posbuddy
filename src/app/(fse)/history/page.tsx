import { FseCallsList } from "@/components/fse/fse-calls-list";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export default async function HistoryPage() {
  const supabase = await createClient();

  // Get stats
  const { count: totalCount }: AnyQuery = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true });

  const { count: closedCount }: AnyQuery = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true })
    .eq("call_status", "Closed");

  const total = totalCount ?? 0;
  const closed = closedCount ?? 0;
  const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

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
    .in("call_status", ["Closed", "Cancelled"])
    .order("updated_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as Record<string, unknown>[];

  const calls = rows.map((row) => {
    const customers = row.customers as { customer_name: string } | null;
    const call_types = row.call_types as { call_type_name: string } | null;
    const acquiring_banks = row.acquiring_banks as { bank_name: string } | null;
    const device_models = row.device_models as { model_name: string } | null;

    const callData = Object.fromEntries(
      Object.entries(row).filter(
        ([k]) =>
          !["customers", "call_types", "acquiring_banks", "device_models"].includes(k)
      )
    );

    return {
      ...callData,
      customer_name: customers?.customer_name,
      call_type_name: call_types?.call_type_name,
      bank_name: acquiring_banks?.bank_name,
      device_model_name: device_models?.model_name,
    };
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">History</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
        <div className="bg-card p-3 text-center">
          <div className="text-xl font-bold text-green-600">{closed}</div>
          <div className="text-[10px] text-muted-foreground">Closed</div>
        </div>
        <div className="bg-card p-3 text-center">
          <div className="text-xl font-bold text-primary">{total}</div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </div>
        <div className="bg-card p-3 text-center">
          <div className="text-xl font-bold text-orange-500">{rate}%</div>
          <div className="text-[10px] text-muted-foreground">Rate</div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {calls.length} completed call{calls.length !== 1 ? "s" : ""}
      </p>

      <FseCallsList calls={calls as Parameters<typeof FseCallsList>[0]["calls"]} />
    </div>
  );
}
