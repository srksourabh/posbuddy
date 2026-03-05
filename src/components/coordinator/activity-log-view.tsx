"use client";

import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActivityEntry {
  log_id: number;
  call_id: number;
  old_status: string | null;
  new_status: string | null;
  change_reason: string | null;
  changed_at: string;
  changed_by_id: number | null;
  changed_by_name: string;
  call_ticket_number: string;
}

interface ActivityLogViewProps {
  logs: ActivityEntry[];
}

function statusBadgeVariant(
  status: string | null
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Closed":
      return "default";
    case "In Progress":
      return "default";
    case "Assigned":
      return "secondary";
    case "Cancelled":
      return "destructive";
    default:
      return "outline";
  }
}

export function ActivityLogView({ logs }: ActivityLogViewProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No recent activity.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative space-y-3">
      <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />
      {logs.map((log) => (
        <div key={log.log_id} className="flex gap-3 relative">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 z-10">
            {getInitials(log.changed_by_name)}
          </div>
          <Card className="flex-1">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-semibold">
                  {log.changed_by_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.changed_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-mono text-muted-foreground">
                  {log.call_ticket_number}
                </span>
                {log.old_status && (
                  <Badge
                    variant={statusBadgeVariant(log.old_status)}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {log.old_status}
                  </Badge>
                )}
                {log.old_status && log.new_status && (
                  <span className="text-xs text-muted-foreground">→</span>
                )}
                {log.new_status && (
                  <Badge
                    variant={statusBadgeVariant(log.new_status)}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {log.new_status}
                  </Badge>
                )}
              </div>
              {log.change_reason && (
                <p className="text-xs text-muted-foreground mt-1">
                  {log.change_reason}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
