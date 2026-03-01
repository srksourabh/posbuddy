import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportsView } from "@/components/reports/reports-view";
import { fetchDashboardStats, fetchCustomerBreakdown } from "../dashboard/actions";
import { fetchCustomers } from "../calls/actions";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          View call statistics and performance metrics.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-96" />}>
        <ReportsSection />
      </Suspense>
    </div>
  );
}

async function ReportsSection() {
  const [stats, customerBreakdown, customers] = await Promise.all([
    fetchDashboardStats(),
    fetchCustomerBreakdown(),
    fetchCustomers(),
  ]);

  return (
    <ReportsView
      stats={stats}
      customerBreakdown={customerBreakdown}
      customers={customers}
    />
  );
}
