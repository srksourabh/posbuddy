import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamView } from "@/components/coordinator/team-view";
import { fetchMyTeamFSEs } from "@/app/(backoffice)/assign/actions";
import { requireBackOffice } from "@/lib/auth/session";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Team</h1>
        <p className="text-muted-foreground">
          Field engineers under your coordination
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <TeamSection />
      </Suspense>
    </div>
  );
}

async function TeamSection() {
  const { staff } = await requireBackOffice();
  const teamFSEs = await fetchMyTeamFSEs();
  return <TeamView fses={teamFSEs} currentUser={staff} />;
}
