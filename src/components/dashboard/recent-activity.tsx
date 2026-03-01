"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityEntry {
  log_id: number;
  call_id: number;
  old_status: string | null;
  new_status: string | null;
  change_reason: string | null;
  changed_at: string;
}

interface RecentActivityProps {
  entries: ActivityEntry[];
}

export function RecentActivity({ entries }: RecentActivityProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-10 text-center text-sm text-muted-foreground">
            No activity yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.log_id} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  Call #{entry.call_id}:{" "}
                  <span className="text-muted-foreground">
                    {entry.old_status ?? "—"}
                  </span>{" "}
                  →{" "}
                  <span className="font-medium">{entry.new_status}</span>
                </p>
                {entry.change_reason && (
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.change_reason}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(entry.changed_at), "dd MMM, hh:mm a")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
