"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/calls/status-badge";
import { AssignDialog } from "@/components/calls/assign-dialog";
import {
  updateCallStatus,
  fetchCallHistory,
  fetchAssignedStaffName,
} from "@/app/(backoffice)/calls/actions";
import type { CallWithRelations } from "@/app/(backoffice)/calls/actions";

interface CallDetailProps {
  call: CallWithRelations;
}

interface StatusLogEntry {
  log_id: number;
  old_status: string | null;
  new_status: string | null;
  changed_by_id: number | null;
  change_reason: string | null;
  changed_at: string;
}

export function CallDetail({ call }: CallDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignOpen, setAssignOpen] = useState(false);
  const [history, setHistory] = useState<StatusLogEntry[]>([]);
  const [assignedName, setAssignedName] = useState<string | null>(null);

  useEffect(() => {
    fetchCallHistory(call.call_id).then(setHistory);
    if (call.assigned_to_id) {
      fetchAssignedStaffName(call.assigned_to_id).then((s) =>
        setAssignedName(s?.full_name ?? null)
      );
    }
  }, [call.call_id, call.assigned_to_id]);

  const handleStatusChange = (newStatus: string) => {
    startTransition(async () => {
      await updateCallStatus(call.call_id, newStatus);
      router.refresh();
    });
  };

  const infoRows: { label: string; value: string | null | undefined }[] = [
    { label: "Ticket #", value: call.call_ticket_number },
    { label: "Customer", value: call.customer_name },
    { label: "Call Type", value: call.call_type_name },
    { label: "Merchant", value: call.merchant_name },
    { label: "MID", value: call.mid },
    { label: "TID", value: call.tid },
    { label: "Bank", value: call.bank_name },
    { label: "Device", value: call.device_model_name },
    {
      label: "Created",
      value: call.created_at
        ? format(new Date(call.created_at), "dd MMM yyyy, hh:mm a")
        : null,
    },
    {
      label: "Call Date",
      value: call.call_creation_date
        ? format(new Date(call.call_creation_date), "dd MMM yyyy")
        : null,
    },
  ];

  const locationRows = [
    { label: "Address", value: call.contact_address },
    { label: "City", value: call.city },
    { label: "District", value: call.district },
    { label: "State", value: call.state },
    { label: "Pincode", value: call.pincode },
  ];

  const contactRows = [
    { label: "Contact Name", value: call.contact_name },
    { label: "Contact Phone", value: call.contact_phone },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {call.call_ticket_number}
          </h1>
          <p className="text-muted-foreground">
            {call.merchant_name ?? "Unknown Merchant"}
          </p>
        </div>
        <StatusBadge status={call.call_status} />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={call.call_status}
          onValueChange={handleStatusChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setAssignOpen(true)}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          {call.assigned_to_id ? "Reassign" : "Assign"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Call Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-right">
                  {row.value ?? "—"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Location + Contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {locationRows.map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-right">
                    {row.value ?? "—"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contactRows.map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-right">
                    {row.value ?? "—"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Assigned To</span>
            <span className="font-medium">
              {assignedName ?? call.assigned_to_name ?? "Unassigned"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Assigned At</span>
            <span className="font-medium">
              {call.assigned_at
                ? format(new Date(call.assigned_at), "dd MMM yyyy, hh:mm a")
                : "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Problem Description */}
      {call.problem_description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Problem Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">
              {call.problem_description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((entry, idx) => (
                <div key={entry.log_id}>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        {entry.old_status ?? "—"}
                      </span>
                      <span className="mx-2">→</span>
                      <span className="font-medium">{entry.new_status}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(
                        new Date(entry.changed_at),
                        "dd MMM yyyy, hh:mm a"
                      )}
                    </span>
                  </div>
                  {entry.change_reason && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {entry.change_reason}
                    </p>
                  )}
                  {idx < history.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        callIds={[call.call_id]}
        onAssigned={() => {
          setAssignOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
