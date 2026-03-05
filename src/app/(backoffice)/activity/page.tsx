import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityLogView } from "@/components/coordinator/activity-log-view";
import { fetchTeamActivityLog } from "@/app/(backoffice)/assign/actions";

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">
          Recent actions by you and your team
        </p>
      </div>
      <Suspense fallback={<ActivitySkeleton />}>
        <ActivitySection />
      </Suspense>
    </div>
  );
}

async function ActivitySection() {
  const logs = await fetchTeamActivityLog();
  return <ActivityLogView logs={logs} />;
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
