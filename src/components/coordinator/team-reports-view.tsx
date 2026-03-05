import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CustomerCallCount,
  FSEClosureRate,
} from "@/app/(backoffice)/team-reports/actions";

interface TeamReportsViewProps {
  customerBreakdown: CustomerCallCount[];
  closureRates: FSEClosureRate[];
}

export function TeamReportsView({
  customerBreakdown,
  closureRates,
}: TeamReportsViewProps) {
  const maxCount = Math.max(...customerBreakdown.map((c) => c.count), 1);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Calls by Customer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Calls by Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customerBreakdown.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data available
            </p>
          )}
          {customerBreakdown.map((c) => {
            const pct = (c.count / maxCount) * 100;
            return (
              <div key={c.customer_code} className="flex items-center gap-3">
                <span className="text-xs w-20 shrink-0 font-medium">
                  {c.customer_code}
                </span>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-bold w-8 text-right">
                  {c.count}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* FSE Closure Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">FSE Closure Rate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {closureRates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No data available
            </p>
          )}
          {closureRates.map((f) => {
            const initials = f.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2);
            return (
              <div key={f.staff_id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {f.full_name}
                  </p>
                  <div className="h-2 bg-muted rounded overflow-hidden mt-1">
                    <div
                      className="h-full bg-green-500 rounded transition-all"
                      style={{ width: `${f.rate}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-bold text-green-600 w-10 text-right">
                  {f.rate}%
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
