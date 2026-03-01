"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin } from "lucide-react";
import { useRealtimeCalls } from "@/hooks/use-realtime-calls";
import type { FseCall } from "@/app/(fse)/my-calls/actions";

interface FseCallsListProps {
  calls: FseCall[];
}

export function FseCallsList({ calls }: FseCallsListProps) {
  const router = useRouter();
  useRealtimeCalls();

  if (calls.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <Phone className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            No calls assigned. Check back later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <Card
          key={call.call_id}
          className="cursor-pointer active:bg-accent/50 transition-colors"
          onClick={() => router.push(`/my-calls/${call.call_id}`)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {call.merchant_name ?? "Unknown Merchant"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {call.call_ticket_number}
                </p>
              </div>
              <Badge
                variant={
                  call.call_status === "In Progress" ? "default" : "secondary"
                }
              >
                {call.call_status}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {call.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {call.city}
                </span>
              )}
              {call.call_type_name && <span>{call.call_type_name}</span>}
              {call.customer_name && <span>{call.customer_name}</span>}
            </div>

            {call.assigned_at && (
              <p className="mt-2 text-xs text-muted-foreground">
                Assigned{" "}
                {format(new Date(call.assigned_at), "dd MMM, hh:mm a")}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
