import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { TeamFSE, PendingCall } from "@/app/(backoffice)/assign/actions";
import { formatDistanceToNow } from "date-fns";

interface CoordinatorDashboardProps {
  stats: {
    unassigned: number;
    teamAssigned: number;
    teamInProgress: number;
    teamClosed: number;
  };
  fses: TeamFSE[];
  pendingCalls: PendingCall[];
  recentActivity: {
    log_id: number;
    call_id: number;
    old_status: string | null;
    new_status: string | null;
    change_reason: string | null;
    changed_at: string;
    changed_by_name: string;
    call_ticket_number: string;
  }[];
}

export function CoordinatorDashboard({
  stats,
  fses,
  pendingCalls,
  recentActivity,
}: CoordinatorDashboardProps) {
  const kpis = [
    {
      label: "Unassigned",
      value: stats.unassigned,
      color: "text-yellow-500",
      borderColor: "border-l-yellow-500",
      sub: "Need assignment",
      icon: AlertTriangle,
    },
    {
      label: "Team — Assigned",
      value: stats.teamAssigned,
      color: "text-blue-600",
      borderColor: "border-l-blue-600",
      sub: "Awaiting FSE visit",
      icon: Users,
    },
    {
      label: "In Progress",
      value: stats.teamInProgress,
      color: "text-indigo-500",
      borderColor: "border-l-indigo-500",
      sub: "FSE on-site now",
      icon: Clock,
    },
    {
      label: "Closed (Team)",
      value: stats.teamClosed,
      color: "text-green-500",
      borderColor: "border-l-green-500",
      sub: "By my FSEs",
      icon: CheckCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Coordinator Dashboard
      </h1>

      {/* KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className={`border-l-4 ${kpi.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {kpi.label}
              </CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>
                {kpi.value}
              </div>
              <p className="text-xs text-muted-foreground">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column: My Team + Unassigned Calls */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Team */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">
              My Team ({fses.length} FSEs)
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/team">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {fses.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No FSEs in your team
              </p>
            )}
            {fses.map((fse) => {
              const isOnSite = fse.in_progress_calls > 0;
              const initials = (fse.full_name ?? "?")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2);
              return (
                <div
                  key={fse.staff_id}
                  className="flex items-center gap-3 p-2 border rounded-lg"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${
                        isOnSite ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {fse.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[fse.city, fse.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p
                      className={`font-bold text-sm ${
                        fse.open_calls > 3
                          ? "text-red-500"
                          : fse.open_calls > 1
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    >
                      {fse.open_calls}
                    </p>
                    <p className="text-[10px] text-muted-foreground">open</p>
                  </div>
                  {isOnSite && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                    >
                      On-site
                    </Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Unassigned Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Unassigned Calls</CardTitle>
            <Button size="sm" asChild>
              <Link href="/assign">Assign Now</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                All calls assigned
              </p>
            ) : (
              <div className="overflow-auto max-h-80">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-muted-foreground border-b">
                      <th className="text-left py-2 font-medium">Ticket</th>
                      <th className="text-left py-2 font-medium">Customer</th>
                      <th className="text-left py-2 font-medium">Merchant</th>
                      <th className="text-left py-2 font-medium">City</th>
                      <th className="text-left py-2 font-medium">Age</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCalls.slice(0, 8).map((c) => (
                      <tr key={c.call_id} className="border-b last:border-0">
                        <td className="py-2 text-xs font-semibold">
                          {c.call_ticket_number}
                        </td>
                        <td className="py-2">
                          <Badge variant="outline" className="text-[10px]">
                            {c.customer_code ?? c.customer_name}
                          </Badge>
                        </td>
                        <td className="py-2 text-xs">
                          {c.merchant_name ?? "—"}
                        </td>
                        <td className="py-2 text-xs">{c.city ?? "—"}</td>
                        <td className="py-2 text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.created_at), {
                            addSuffix: true,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Recent Activity</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/activity">View All</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          )}
          {recentActivity.slice(0, 5).map((entry) => (
            <div key={entry.log_id} className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{entry.changed_by_name}</span>
                  {" — "}
                  {entry.change_reason ?? `${entry.old_status} → ${entry.new_status}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.call_ticket_number}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(entry.changed_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
