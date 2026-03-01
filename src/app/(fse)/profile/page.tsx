import { requireFSE } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FseLogout } from "@/components/fse/fse-logout";

export default async function ProfilePage() {
  const { staff } = await requireFSE();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>

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
