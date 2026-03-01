import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export default async function ActiveVisitPage() {
  const supabase = await createClient();

  // Find the call currently "In Progress" for this FSE
  const { data }: AnyQuery = await supabase
    .from("calls")
    .select("call_id")
    .eq("call_status", "In Progress")
    .limit(1);

  const rows = (data ?? []) as { call_id: number }[];

  if (rows.length > 0) {
    redirect(`/my-calls/${rows[0].call_id}`);
  }

  // No active visit — show a message
  const { Card, CardContent } = await import("@/components/ui/card");
  const { MapPin } = await import("lucide-react");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Active Visit</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <MapPin className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            No active visit. Start a visit from your calls list.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
