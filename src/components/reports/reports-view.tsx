"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DashboardStats, CustomerBreakdown } from "@/app/(backoffice)/dashboard/actions";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Assigned: "#6366f1",
  "In Progress": "#3b82f6",
  Closed: "#22c55e",
  Cancelled: "#ef4444",
};

interface ReportsViewProps {
  stats: DashboardStats;
  customerBreakdown: CustomerBreakdown[];
  customers: { customer_id: number; customer_name: string }[];
}

export function ReportsView({
  stats,
  customerBreakdown,
}: ReportsViewProps) {
  const statusData = [
    { name: "Pending", value: stats.pending },
    { name: "Assigned", value: stats.assigned },
    { name: "In Progress", value: stats.inProgress },
    { name: "Closed", value: stats.closed },
    { name: "Cancelled", value: stats.cancelled },
  ];

  const closureRate =
    stats.total > 0 ? ((stats.closed / stats.total) * 100).toFixed(1) : "0";

  const assignmentRate =
    stats.total > 0
      ? (
          ((stats.assigned + stats.inProgress + stats.closed) / stats.total) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Closure Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{closureRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.closed} of {stats.total} calls closed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Assignment Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignmentRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.assigned + stats.inProgress + stats.closed} of{" "}
              {stats.total} calls assigned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Backlog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Calls awaiting assignment
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData.filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Calls by Customer</CardTitle>
          </CardHeader>
          <CardContent>
            {customerBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={customerBreakdown.slice(0, 8)} layout="vertical">
                  <XAxis type="number" />
                  <YAxis
                    type="category"
                    dataKey="customer_name"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No data yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerBreakdown.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-16 text-center text-muted-foreground"
                    >
                      No data
                    </TableCell>
                  </TableRow>
                ) : (
                  customerBreakdown.map((row) => (
                    <TableRow key={row.customer_name}>
                      <TableCell className="font-medium">
                        {row.customer_name}
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">
                        {stats.total > 0
                          ? ((row.count / stats.total) * 100).toFixed(1)
                          : "0"}
                        %
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
