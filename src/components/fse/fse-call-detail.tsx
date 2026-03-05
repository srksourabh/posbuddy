"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Play,
  Navigation,
  ClipboardCheck,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClosureForm } from "@/components/fse/closure-form";
import { startVisit } from "@/app/(fse)/my-calls/actions";
import type { FseCall, ClosureTemplateField } from "@/app/(fse)/my-calls/actions";

interface FseCallDetailProps {
  call: FseCall;
  closureTemplate?: ClosureTemplateField[];
  visitStartTime?: string | null;
}

function VisitTimer({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const tick = () => {
      const diff = Math.max(0, Date.now() - start);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
      <span className="text-2xl font-bold tabular-nums">{elapsed}</span>
      <span className="text-xs opacity-70">visit duration</span>
    </div>
  );
}

export function FseCallDetail({
  call,
  closureTemplate,
  visitStartTime,
}: FseCallDetailProps) {
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

  const address = [call.contact_address, call.city, call.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-4">
      {/* Back button (only when not in-progress, since header replaces it) */}
      {!isInProgress && (
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
          <Badge variant="secondary">{call.call_status}</Badge>
        </div>
      )}

      {/* Active visit gradient header */}
      {isInProgress && (
        <div className="-mx-4 -mt-4 bg-gradient-to-br from-blue-900 to-blue-800 text-white px-4 pt-4 pb-5 rounded-b-xl">
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 -ml-2"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="text-[11px] uppercase tracking-wide opacity-70">
              Active Visit
            </span>
          </div>
          <h1 className="text-xl font-bold">
            {call.merchant_name ?? "Unknown Merchant"}
          </h1>
          <p className="text-sm opacity-80 mt-0.5">
            {call.call_ticket_number}
          </p>
          <div className="flex gap-2 flex-wrap mt-2">
            {call.call_type_name && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/20">
                {call.call_type_name}
              </span>
            )}
            {call.customer_name && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/20">
                {call.customer_name}
              </span>
            )}
            {call.device_model_name && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/20">
                {call.device_model_name}
              </span>
            )}
          </div>
          {visitStartTime && <VisitTimer startTime={visitStartTime} />}
        </div>
      )}

      {/* Start Visit button */}
      {isAssigned && (
        <Button
          className="w-full"
          onClick={handleStartVisit}
          disabled={isPending}
        >
          <Play className="mr-2 h-4 w-4" />
          {isPending ? "Starting..." : "Start Visit"}
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Info Cards */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="text-foreground text-[15px]">
            {call.contact_address || "Address not available"}
          </p>
          <p className="text-muted-foreground text-[13px]">
            {[call.city, call.state, call.pincode].filter(Boolean).join(", ")}
          </p>
        </CardContent>
      </Card>

      {(call.contact_name || call.contact_phone) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {call.contact_name && (
              <p className="text-foreground text-[15px]">{call.contact_name}</p>
            )}
            {call.contact_phone && (
              <a
                href={`tel:${call.contact_phone}`}
                className="text-primary flex items-center gap-1 text-sm mt-1"
              >
                <Phone className="h-3.5 w-3.5" />
                {call.contact_phone}
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {call.problem_description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              Problem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {call.problem_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick action grid */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className="flex-col gap-1 h-auto py-3 bg-slate-50 dark:bg-slate-900 border-slate-200"
          onClick={() => {
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
              "_blank"
            );
          }}
        >
          <Navigation className="h-5 w-5" />
          <span className="text-[11px]">Navigate</span>
        </Button>
        {call.contact_phone ? (
          <Button
            variant="outline"
            className="flex-col gap-1 h-auto py-3 bg-slate-50 dark:bg-slate-900 border-slate-200"
            asChild
          >
            <a href={`tel:${call.contact_phone}`}>
              <Phone className="h-5 w-5" />
              <span className="text-[11px]">Call</span>
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            className="flex-col gap-1 h-auto py-3"
            disabled
          >
            <Phone className="h-5 w-5" />
            <span className="text-[11px]">Call</span>
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-col gap-1 h-auto py-3 bg-slate-50 dark:bg-slate-900 border-slate-200"
          onClick={() => setShowClosure(true)}
          disabled={!isInProgress}
        >
          <ClipboardCheck className="h-5 w-5" />
          <span className="text-[11px]">Close</span>
        </Button>
      </div>

      {/* Full-width green Complete button */}
      {isInProgress && !showClosure && (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-base font-bold rounded-xl"
          onClick={() => setShowClosure(true)}
        >
          <CheckCircle className="mr-2 h-5 w-5" />
          Complete Visit & Close Call
        </Button>
      )}

      {/* Closure Form */}
      {showClosure && (
        <ClosureForm
          callId={call.call_id}
          templateFields={closureTemplate}
          onClose={() => setShowClosure(false)}
          onClosed={() => router.push("/my-calls")}
        />
      )}

      {/* Call Details card */}
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
