"use client";

import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Navigation, CheckCircle, Play } from "lucide-react";
import { useRealtimeCalls } from "@/hooks/use-realtime-calls";
import { startVisit } from "@/app/(fse)/my-calls/actions";
import { useTransition } from "react";
import type { FseCall } from "@/app/(fse)/my-calls/actions";

interface FseCallsListProps {
  calls: FseCall[];
}

const callTypeColors: Record<string, { bg: string; text: string }> = {
  Installation: { bg: "bg-green-100", text: "text-green-700" },
  "De-installation": { bg: "bg-red-100", text: "text-red-700" },
  "Break Down": { bg: "bg-yellow-100", text: "text-yellow-700" },
  "Asset Swap": { bg: "bg-blue-100", text: "text-blue-700" },
  "PM Visit": { bg: "bg-purple-100", text: "text-purple-700" },
};

export function FseCallsList({ calls }: FseCallsListProps) {
  const router = useRouter();
  useRealtimeCalls();

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <p className="font-semibold text-green-600">All Clear</p>
        <p className="text-sm text-muted-foreground text-center">
          No pending calls assigned to you
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {calls.length} call{calls.length !== 1 ? "s" : ""} assigned to you
      </p>
      {calls.map((call) => (
        <FseCallCard
          key={call.call_id}
          call={call}
          onNavigate={() => router.push(`/my-calls/${call.call_id}`)}
          onRefresh={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function FseCallCard({
  call,
  onNavigate,
  onRefresh,
}: {
  call: FseCall;
  onNavigate: () => void;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAssigned = call.call_status === "Assigned";
  const isInProgress = call.call_status === "In Progress";
  const typeStyle = callTypeColors[call.call_type_name ?? ""] ?? {
    bg: "bg-muted",
    text: "text-muted-foreground",
  };

  const barColor = isInProgress
    ? "bg-indigo-500"
    : isAssigned
      ? "bg-orange-500"
      : "bg-muted";

  const handleStartVisit = (e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      await startVisit(call.call_id);
      onRefresh();
    });
  };

  return (
    <div
      className="bg-card border rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
      onClick={onNavigate}
    >
      <div className={`h-1 ${barColor}`} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold leading-tight truncate">
              {call.merchant_name ?? "Unknown Merchant"}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {call.call_ticket_number}
            </p>
          </div>
          <Badge
            variant={isInProgress ? "default" : "secondary"}
            className="shrink-0"
          >
            {call.call_status}
          </Badge>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {call.call_type_name && (
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${typeStyle.bg} ${typeStyle.text}`}
            >
              {call.call_type_name}
            </span>
          )}
          {call.customer_name && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {call.customer_name}
            </span>
          )}
          {call.device_model_name && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {call.device_model_name}
            </span>
          )}
        </div>

        {/* Location + Time */}
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{call.city ?? "—"}, {call.state ?? ""}</span>
          {call.assigned_at && (
            <span className="ml-auto text-xs">
              {formatDistanceToNow(new Date(call.assigned_at), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>

        {/* Actions */}
        {(isAssigned || isInProgress) && (
          <div className="flex gap-2 mt-3">
            {isAssigned && (
              <Button
                className="flex-1"
                size="sm"
                onClick={handleStartVisit}
                disabled={isPending}
              >
                <Play className="mr-1.5 h-4 w-4" />
                {isPending ? "Starting..." : "Start Visit"}
              </Button>
            )}
            {isInProgress && (
              <Button
                className="flex-1"
                size="sm"
                variant="default"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/my-calls/${call.call_id}`);
                }}
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                Complete & Close
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                const addr = [
                  call.contact_address,
                  call.city,
                  call.state,
                ].filter(Boolean).join(", ");
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
                  "_blank"
                );
              }}
            >
              <Navigation className="h-4 w-4" />
            </Button>
            {call.contact_phone && (
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 h-9 w-9"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={`tel:${call.contact_phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
