import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AssignCallsView } from "@/components/coordinator/assign-calls-view";
import { fetchPendingCalls, fetchMyTeamFSEs } from "./actions";

export default function AssignCallsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Assign Calls</h1>
        <p className="text-muted-foreground">
          Assign pending calls to your field engineers
        </p>
      </div>
      <Suspense fallback={<AssignSkeleton />}>
        <AssignSection />
      </Suspense>
    </div>
  );
}

async function AssignSection() {
  const [pendingCalls, teamFSEs] = await Promise.all([
    fetchPendingCalls(),
    fetchMyTeamFSEs(),
  ]);

  return <AssignCallsView pendingCalls={pendingCalls} teamFSEs={teamFSEs} />;
}

function AssignSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-96" />
      <Skeleton className="h-96" />
    </div>
  );
}
