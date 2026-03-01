"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClosureForm } from "@/components/fse/closure-form";
import { startVisit } from "@/app/(fse)/my-calls/actions";
import type { FseCall } from "@/app/(fse)/my-calls/actions";

interface FseCallDetailProps {
  call: FseCall;
}

export function FseCallDetail({ call }: FseCallDetailProps) {
  const router = useRouter();
  const [showClosure, setShowClosure] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleStartVisit = () => {
    setError(null);
    startTransition(async () => {
      const result = await startVisit(call.call_id);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const isAssigned = call.call_status === "Assigned";
  const isInProgress = call.call_status === "In Progress";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">
            {call.merchant_name ?? "Unknown"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {call.call_ticket_number}
          </p>
        </div>
        <Badge
          variant={isInProgress ? "default" : "secondary"}
        >
          {call.call_status}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isAssigned && (
          <Button
            className="flex-1"
            onClick={handleStartVisit}
            disabled={isPending}
          >
            <Play className="mr-2 h-4 w-4" />
            {isPending ? "Starting..." : "Start Visit"}
          </Button>
        )}
        {isInProgress && !showClosure && (
          <Button
            className="flex-1"
            onClick={() => setShowClosure(true)}
          >
            Close Call
          </Button>
        )}
        {call.contact_phone && (
          <Button
            variant="outline"
            size="icon"
            asChild
          >
            <a href={`tel:${call.contact_phone}`}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Closure Form */}
      {showClosure && (
        <ClosureForm
          callId={call.call_id}
          onClose={() => setShowClosure(false)}
          onClosed={() => router.push("/my-calls")}
        />
      )}

      {/* Call Info Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Call Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <InfoRow label="Customer" value={call.customer_name} />
          <InfoRow label="Call Type" value={call.call_type_name} />
          <InfoRow label="MID" value={call.mid} />
          <InfoRow label="TID" value={call.tid} />
          <InfoRow label="Bank" value={call.bank_name} />
          <InfoRow label="Device" value={call.device_model_name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {call.contact_address && (
            <p className="text-muted-foreground">{call.contact_address}</p>
          )}
          <InfoRow
            label="City"
            value={[call.city, call.district].filter(Boolean).join(", ")}
          />
          <InfoRow
            label="State"
            value={[call.state, call.pincode].filter(Boolean).join(" - ")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <InfoRow label="Name" value={call.contact_name} />
          <InfoRow label="Phone" value={call.contact_phone} />
        </CardContent>
      </Card>

      {call.problem_description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Problem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {call.problem_description}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
