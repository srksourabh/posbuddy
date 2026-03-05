import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTeamCalls, fetchTeamFSEOptions } from "./actions";
import { fetchCustomers } from "../calls/actions";
import { TeamCallsFilters } from "@/components/coordinator/team-calls-filters";
import { TeamCallsTable } from "@/components/coordinator/team-calls-table";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    customer?: string;
    status?: string;
    fse?: string;
  }>;
}

export default async function TeamCallsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Calls</h1>
        <p className="text-muted-foreground">
          Calls assigned to your FSEs
        </p>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <FiltersSection />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <DataSection params={params} />
      </Suspense>
    </div>
  );
}

async function FiltersSection() {
  const [customers, fses] = await Promise.all([
    fetchCustomers(),
    fetchTeamFSEOptions(),
  ]);
  return <TeamCallsFilters customers={customers} fses={fses} />;
}

async function DataSection({
  params,
}: {
  params: {
    search?: string;
    customer?: string;
    status?: string;
    fse?: string;
  };
}) {
  const [calls, fses] = await Promise.all([
    fetchTeamCalls({
      search: params.search,
      customerId: params.customer ? Number(params.customer) : undefined,
      status: params.status,
      fseId: params.fse ? Number(params.fse) : undefined,
    }),
    fetchTeamFSEOptions(),
  ]);

  return <TeamCallsTable calls={calls} fses={fses} />;
}

function FiltersSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-10 w-48" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
