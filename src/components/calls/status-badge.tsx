"use client";

import { Badge } from "@/components/ui/badge";
import { STATUS_VARIANTS } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const variant = STATUS_VARIANTS[status] ?? "outline";
  return <Badge variant={variant}>{status}</Badge>;
}
