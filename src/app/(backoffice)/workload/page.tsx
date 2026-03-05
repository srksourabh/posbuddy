import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkloadView } from "@/components/coordinator/workload-view";
import { fetchMyTeamFSEs } from "@/app/(backoffice)/assign/actions";

export default function WorkloadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workload</h1>
        <p className="text-muted-foreground">
          Call distribution across your team
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-80" />}>
        <WorkloadSection />
      </Suspense>
    </div>
  );
}

async function WorkloadSection() {
  const teamFSEs = await fetchMyTeamFSEs();
  return <WorkloadView fses={teamFSEs} />;
}
