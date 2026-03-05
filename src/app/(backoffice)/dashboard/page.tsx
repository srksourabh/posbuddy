import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchDashboardStats,
  fetchCustomerBreakdown,
  fetchRecentActivity,
} from "./actions";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { CoordinatorDashboard } from "@/components/coordinator/coordinator-dashboard";
import {
  fetchMyTeamFSEs,
  fetchPendingCalls,
  fetchTeamCallStats,
  fetchTeamActivityLog,
} from "../assign/actions";
import { requireBackOffice } from "@/lib/auth/session";
import { Phone, Clock, CheckCircle, AlertTriangle } from "lucide-react";

export default async function DashboardPage() {
  const authUser = await requireBackOffice();
  const isAdmin = authUser.staff.is_admin;

  if (!isAdmin) {
    return (
      <Suspense fallback={<CoordSkeleton />}>
        <CoordinatorSection />
      </Suspense>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-80" />}>
          <ChartsSection />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-80" />}>
          <ActivitySection />
        </Suspense>
      </div>
    </div>
  );
}

async function CoordinatorSection() {
  const [fses, pendingCalls, teamStats, activityLog] = await Promise.all([
    fetchMyTeamFSEs(),
    fetchPendingCalls(),
    fetchTeamCallStats(),
    fetchTeamActivityLog(),
  ]);

  return (
    <CoordinatorDashboard
      stats={{
        unassigned: teamStats.pending,
        teamAssigned: teamStats.assigned,
        teamInProgress: teamStats.inProgress,
        teamClosed: teamStats.closed,
      }}
      fses={fses}
      pendingCalls={pendingCalls}
      recentActivity={activityLog}
    />
  );
}

async function StatsSection() {
  const stats = await fetchDashboardStats();

  const cards = [
    {
      title: "Total Calls",
      value: stats.total,
      icon: Phone,
      desc: "All imported calls",
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: AlertTriangle,
      desc: "Awaiting assignment",
    },
    {
      title: "In Progress",
      value: stats.assigned + stats.inProgress,
      icon: Clock,
      desc: `${stats.assigned} assigned, ${stats.inProgress} on-site`,
    },
    {
      title: "Closed",
      value: stats.closed,
      icon: CheckCircle,
      desc: `${stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0}% closure rate`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function ChartsSection() {
  const [stats, customerBreakdown] = await Promise.all([
    fetchDashboardStats(),
    fetchCustomerBreakdown(),
  ]);

  const statusData = [
    { name: "Pending", value: stats.pending },
    { name: "Assigned", value: stats.assigned },
    { name: "In Progress", value: stats.inProgress },
    { name: "Closed", value: stats.closed },
    { name: "Cancelled", value: stats.cancelled },
  ].filter((d) => d.value > 0);

  return (
    <DashboardCharts
      statusData={statusData}
      customerData={customerBreakdown}
    />
  );
}

async function ActivitySection() {
  const activity = await fetchRecentActivity();
  return <RecentActivity entries={activity} />;
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

function CoordSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
