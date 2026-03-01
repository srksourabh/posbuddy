import { Suspense } from "react";
import { fetchCalls, fetchCustomers } from "./actions";
import { CallsTable } from "@/components/calls/calls-table";
import { CallsFilters } from "@/components/calls/calls-filters";
import { Skeleton } from "@/components/ui/skeleton";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    customer?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function CallsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calls</h1>
        <p className="text-muted-foreground">
          View, filter, and manage service calls.
        </p>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <FiltersSection />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <CallsSection params={params} />
      </Suspense>
    </div>
  );
}

async function FiltersSection() {
  const customers = await fetchCustomers();
  return <CallsFilters customers={customers} />;
}

async function CallsSection({
  params,
}: {
  params: {
    status?: string;
    customer?: string;
    search?: string;
    page?: string;
  };
}) {
  const result = await fetchCalls({
    status: params.status,
    customerId: params.customer ? Number(params.customer) : undefined,
    search: params.search,
    page: params.page ? Number(params.page) : 1,
    pageSize: 25,
  });

  return (
    <CallsTable
      calls={result.calls}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
    />
  );
}

function FiltersSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-10 w-64" />
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
