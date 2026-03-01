"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Assigned: "#6366f1",
  "In Progress": "#3b82f6",
  Closed: "#22c55e",
  Cancelled: "#ef4444",
};

interface DashboardChartsProps {
  statusData: { name: string; value: number }[];
  customerData: { customer_name: string; count: number }[];
}

export function DashboardCharts({
  statusData,
  customerData,
}: DashboardChartsProps) {
  const hasStatusData = statusData.length > 0;
  const hasCustomerData = customerData.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calls by Status</CardTitle>
        </CardHeader>
        <CardContent>
          {hasStatusData ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No data yet. Import calls to see the breakdown.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Calls by Customer</CardTitle>
        </CardHeader>
        <CardContent>
          {hasCustomerData ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={customerData.slice(0, 6)} layout="vertical">
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="customer_name"
                  width={100}
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
    </>
  );
}
