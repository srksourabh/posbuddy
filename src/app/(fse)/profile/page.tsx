import { requireFSE } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FseLogout } from "@/components/fse/fse-logout";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export default async function ProfilePage() {
  const { staff } = await requireFSE();
  const supabase = await createClient();

  // Get call stats
  const { count: totalCount }: AnyQuery = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true });

  const { count: closedCount }: AnyQuery = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true })
    .eq("call_status", "Closed");

  const { count: openCount }: AnyQuery = await supabase
    .from("calls")
    .select("*", { count: "exact", head: true })
    .in("call_status", ["Assigned", "In Progress"]);

  const total = totalCount ?? 0;
  const closed = closedCount ?? 0;
  const open = openCount ?? 0;
  const rate = total > 0 ? Math.round((closed / total) * 100) : 0;

  // Get manager info
  let manager: { full_name: string | null; designation: string | null } | null =
    null;
  if (staff.reports_to_id) {
    const { data: mgrData }: AnyQuery = await supabase
      .from("pos_staff")
      .select("full_name, designation")
      .eq("staff_id", staff.reports_to_id)
      .limit(1);
    manager =
      ((mgrData ?? []) as { full_name: string | null; designation: string | null }[])[0] ?? null;
  }

  // Get unique customers served
  const { data: customerData }: AnyQuery = await supabase
    .from("calls")
    .select("customer_id, customers ( customer_name, customer_code )")
    .not("customer_id", "is", null);

  const customers = (customerData ?? []) as {
    customer_id: number;
    customers: { customer_name: string; customer_code: string } | null;
  }[];
  const uniqueCustomers = [
    ...new Map(
      customers
        .filter((c) => c.customers)
        .map((c) => [c.customer_id, c.customers!])
    ).values(),
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>

      {/* Stats banner */}
      <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden">
        <div className="bg-card p-4 text-center">
          <div className="text-2xl font-bold text-primary">{total}</div>
          <div className="text-[11px] text-muted-foreground">Total</div>
        </div>
        <div className="bg-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{closed}</div>
          <div className="text-[11px] text-muted-foreground">Closed</div>
        </div>
        <div className="bg-card p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">{open}</div>
          <div className="text-[11px] text-muted-foreground">Open</div>
        </div>
      </div>

      {rate > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {rate}% closure rate
        </p>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Staff Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <InfoRow label="Name" value={staff.full_name} />
          <InfoRow label="Employee Code" value={staff.hr_emp_code} />
          <InfoRow label="Department" value={staff.department} />
          <InfoRow label="Designation" value={staff.designation} />
          <InfoRow label="Phone" value={staff.phone} />
          <InfoRow label="Email" value={staff.email} />
          <InfoRow
            label="Location"
            value={
              [staff.city, staff.state].filter(Boolean).join(", ") || null
            }
          />
        </CardContent>
      </Card>

      {manager && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Reports To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold shrink-0">
                {getInitials(manager.full_name)}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {manager.full_name ?? "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {manager.designation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {uniqueCustomers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Customers Served</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {uniqueCustomers.map((c) => (
                <Badge key={c.customer_code} variant="secondary">
                  {c.customer_code}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <FseLogout />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
