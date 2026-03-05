import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTeamCustomerBreakdown, fetchFSEClosureRates } from "./actions";
import { TeamReportsView } from "@/components/coordinator/team-reports-view";

export default function TeamReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Reports</h1>
        <p className="text-muted-foreground">
          Performance metrics for your team
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        }
      >
        <ReportsSection />
      </Suspense>
    </div>
  );
}

async function ReportsSection() {
  const [customerBreakdown, closureRates] = await Promise.all([
    fetchTeamCustomerBreakdown(),
    fetchFSEClosureRates(),
  ]);

  return (
    <TeamReportsView
      customerBreakdown={customerBreakdown}
      closureRates={closureRates}
    />
  );
}
