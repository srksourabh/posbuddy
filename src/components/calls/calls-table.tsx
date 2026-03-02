"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { useRealtimeCalls } from "@/hooks/use-realtime-calls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/calls/status-badge";
import { AssignDialog } from "@/components/calls/assign-dialog";
import type { CallWithRelations } from "@/app/(backoffice)/calls/actions";

interface CallsTableProps {
  calls: CallWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

export function CallsTable({ calls, total, page, pageSize }: CallsTableProps) {
  const router = useRouter();
  useRealtimeCalls();
  const [selected, setSelected] = useState<number[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const toggleSelect = (callId: number) => {
    setSelected((prev) =>
      prev.includes(callId)
        ? prev.filter((id) => id !== callId)
        : [...prev, callId]
    );
  };

  const toggleAll = () => {
    if (selected.length === calls.length) {
      setSelected([]);
    } else {
      setSelected(calls.map((c) => c.call_id));
    }
  };

  const pendingSelected = selected.filter((id) => {
    const call = calls.find((c) => c.call_id === id);
    return call && (call.call_status === "Pending" || call.call_status === "Assigned");
  });

  return (
    <>
      {selected.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2 mb-4">
          <span className="text-sm font-medium">
            {selected.length} selected
          </span>
          {pendingSelected.length > 0 && (
            <Button size="sm" onClick={() => setAssignOpen(true)}>
              Assign ({pendingSelected.length})
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected([])}
          >
            Clear
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    calls.length > 0 && selected.length === calls.length
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Ticket #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="h-24 text-center text-muted-foreground"
                >
                  No calls found.
                </TableCell>
              </TableRow>
            ) : (
              calls.map((call) => (
                <TableRow
                  key={call.call_id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/calls/${call.call_id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.includes(call.call_id)}
                      onCheckedChange={() => toggleSelect(call.call_id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {call.call_ticket_number}
                  </TableCell>
                  <TableCell>{call.customer_name ?? "—"}</TableCell>
                  <TableCell>
                    <div>{call.merchant_name ?? "—"}</div>
                    {call.mid && (
                      <div className="text-xs text-muted-foreground">
                        MID: {call.mid}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{call.city ?? "—"}</TableCell>
                  <TableCell>
                    {call.merchant_latitude && call.merchant_longitude ? (
                      <a
                        href={`https://www.google.com/maps?q=${call.merchant_latitude},${call.merchant_longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Number(call.merchant_latitude).toFixed(4)}, {Number(call.merchant_longitude).toFixed(4)}
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{call.call_type_name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={call.call_status} />
                  </TableCell>
                  <TableCell>{call.assigned_to_name ?? "Unassigned"}</TableCell>
                  <TableCell>
                    {call.created_at
                      ? format(new Date(call.created_at), "dd MMM yyyy")
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(page - 1));
                router.push(`/calls?${params.toString()}`);
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(page + 1));
                router.push(`/calls?${params.toString()}`);
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <AssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        callIds={pendingSelected}
        onAssigned={() => {
          setSelected([]);
          setAssignOpen(false);
        }}
      />
    </>
  );
}
