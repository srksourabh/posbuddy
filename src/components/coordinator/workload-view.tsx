"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TeamFSE } from "@/app/(backoffice)/assign/actions";

interface WorkloadViewProps {
  fses: TeamFSE[];
}

export function WorkloadView({ fses }: WorkloadViewProps) {
  const maxCalls = Math.max(8, ...fses.map((f) => f.open_calls + 2));

  if (fses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No field engineers in your team yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Call Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fses.map((fse) => {
          const inProgressPct =
            maxCalls > 0
              ? (fse.in_progress_calls / maxCalls) * 100
              : 0;
          const assignedPct =
            maxCalls > 0
              ? ((fse.open_calls - fse.in_progress_calls) / maxCalls) * 100
              : 0;

          return (
            <div key={fse.staff_id} className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                {getInitials(fse.full_name)}
              </div>
              <div className="w-28 text-sm font-medium truncate">
                {fse.full_name ?? "Unknown"}
              </div>
              <div className="flex-1 h-7 bg-muted rounded-md overflow-hidden flex">
                {fse.in_progress_calls > 0 && (
                  <div
                    className="h-full bg-indigo-500 flex items-center justify-center"
                    style={{ width: `${inProgressPct}%` }}
                  >
                    <span className="text-[10px] text-white font-bold px-1">
                      {fse.in_progress_calls} live
                    </span>
                  </div>
                )}
                {fse.open_calls - fse.in_progress_calls > 0 && (
                  <div
                    className="h-full bg-orange-500 flex items-center justify-center"
                    style={{ width: `${assignedPct}%` }}
                  >
                    <span className="text-[10px] text-white font-bold px-1">
                      {fse.open_calls - fse.in_progress_calls} open
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground w-14 text-right">
                {fse.open_calls} total
              </div>
            </div>
          );
        })}

        <div className="flex gap-4 text-xs pt-2 border-t">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
            In Progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
            Assigned
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
