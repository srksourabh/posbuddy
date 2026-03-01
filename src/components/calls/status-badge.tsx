"use client";

import { Badge } from "@/components/ui/badge";
import type { CallStatus } from "@/lib/types/database";

const statusConfig: Record<
  CallStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  Pending: { label: "Pending", variant: "outline" },
  Assigned: { label: "Assigned", variant: "secondary" },
  "In Progress": { label: "In Progress", variant: "default" },
  Closed: { label: "Closed", variant: "secondary" },
  Cancelled: { label: "Cancelled", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as CallStatus] ?? {
    label: status,
    variant: "outline" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
