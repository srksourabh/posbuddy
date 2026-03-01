import { createClient } from "@/lib/supabase/server";
import { MasterTable } from "@/components/master/master-table";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export default async function StaffPage() {
  const supabase = await createClient();
  const { data }: AnyQuery = await supabase
    .from("pos_staff")
    .select("staff_id, full_name, hr_emp_code, department, designation, phone, email, city, is_active")
    .order("full_name");

  const rows = (data ?? []) as {
    staff_id: number;
    full_name: string | null;
    hr_emp_code: string;
    department: string | null;
    designation: string | null;
    phone: string | null;
    email: string | null;
    city: string | null;
    is_active: boolean;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
        <p className="text-muted-foreground">
          View and manage staff members.
        </p>
      </div>
      <MasterTable
        columns={[
          { key: "staff_id", label: "ID" },
          { key: "full_name", label: "Name" },
          { key: "hr_emp_code", label: "Emp Code" },
          { key: "department", label: "Department" },
          { key: "designation", label: "Designation" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "city", label: "City" },
          { key: "is_active", label: "Active", type: "boolean" },
        ]}
        rows={rows}
        idKey="staff_id"
      />
    </div>
  );
}
