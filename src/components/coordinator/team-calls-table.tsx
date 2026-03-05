"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import type { TeamCall } from "@/app/(backoffice)/team-calls/actions";
import { assignCall } from "@/app/(backoffice)/calls/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TeamCallsTableProps {
  calls: TeamCall[];
  fses: { staff_id: number; full_name: string }[];
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Pending: "outline",
  Assigned: "secondary",
  "In Progress": "default",
  Closed: "secondary",
  Cancelled: "destructive",
};

export function TeamCallsTable({ calls, fses }: TeamCallsTableProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showAssign, setShowAssign] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === calls.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(calls.map((c) => c.call_id)));
    }
  };

  const handleBulkAssign = (fseId: number) => {
    if (selected.size === 0) return;
    startTransition(async () => {
      const ids = [...selected];
      let errors = 0;
      for (const id of ids) {
        const result = await assignCall(id, fseId);
        if (result.error) errors++;
      }
      if (errors > 0) {
        toast.error(`Failed to assign ${errors} of ${ids.length} calls`);
      } else {
        toast.success(`Assigned ${ids.length} call(s) successfully`);
      }
      setSelected(new Set());
      setShowAssign(false);
      router.refresh();
    });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        {selected.size > 0 && (
          <Button
            size="sm"
            onClick={() => setShowAssign(!showAssign)}
            disabled={isPending}
          >
            Bulk Assign ({selected.size})
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          {calls.length} calls
        </span>
      </div>

      {showAssign && selected.size > 0 && (
        <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-2">
          <p className="text-sm font-medium">
            Assign {selected.size} call(s) to:
          </p>
          <div className="flex flex-wrap gap-2">
            {fses.map((f) => (
              <Button
                key={f.staff_id}
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => handleBulkAssign(f.staff_id)}
              >
                {f.full_name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left w-8">
                <input
                  type="checkbox"
                  checked={selected.size === calls.length && calls.length > 0}
                  onChange={toggleAll}
                  className="accent-primary"
                />
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                Ticket #
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                Customer
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                Merchant
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                City
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                Type
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                Assigned To
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                Age
              </th>
              <th className="p-3 text-left text-xs font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 && (
              <tr>
                <td colSpan={10} className="p-8 text-center text-muted-foreground">
                  No calls found
                </td>
              </tr>
            )}
            {calls.map((c) => (
              <tr key={c.call_id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.call_id)}
                    onChange={() => toggleSelect(c.call_id)}
                    className="accent-primary"
                  />
                </td>
                <td className="p-3 font-semibold text-xs">
                  <Link
                    href={`/calls/${c.call_id}`}
                    className="hover:underline"
                  >
                    {c.call_ticket_number}
                  </Link>
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="text-[10px]">
                    {c.customer_code ?? c.customer_name}
                  </Badge>
                </td>
                <td className="p-3 text-xs">{c.merchant_name ?? "—"}</td>
                <td className="p-3 text-xs">{c.city ?? "—"}</td>
                <td className="p-3">
                  {c.call_type_name && (
                    <Badge variant="outline" className="text-[10px]">
                      {c.call_type_name}
                    </Badge>
                  )}
                </td>
                <td className="p-3">
                  <Badge variant={statusVariants[c.call_status] ?? "secondary"}>
                    {c.call_status}
                  </Badge>
                </td>
                <td className="p-3 text-xs">
                  {c.assigned_to_name ?? (
                    <span className="text-red-500">Unassigned</span>
                  )}
                </td>
                <td className="p-3 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), {
                    addSuffix: true,
                  })}
                </td>
                <td className="p-3">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/calls/${c.call_id}`}>View</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
