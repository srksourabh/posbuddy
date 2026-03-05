"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { MapPin, UserCheck, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getInitials } from "@/lib/helpers";
import { assignCall, bulkAssignCalls } from "@/app/(backoffice)/calls/actions";
import type { PendingCall, TeamFSE } from "@/app/(backoffice)/assign/actions";

interface AssignCallsViewProps {
  pendingCalls: PendingCall[];
  teamFSEs: TeamFSE[];
}

export function AssignCallsView({
  pendingCalls,
  teamFSEs,
}: AssignCallsViewProps) {
  const router = useRouter();
  const [selectedCalls, setSelectedCalls] = useState<number[]>([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedFSE, setSelectedFSE] = useState<number | null>(null);
  const [fseSearch, setFseSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const toggleCall = (callId: number) => {
    setSelectedCalls((prev) =>
      prev.includes(callId)
        ? prev.filter((id) => id !== callId)
        : [...prev, callId]
    );
  };

  const handleAssign = () => {
    if (selectedCalls.length === 0) return;
    setShowAssignDialog(true);
  };

  const confirmAssign = () => {
    if (!selectedFSE) return;
    startTransition(async () => {
      const result =
        selectedCalls.length === 1
          ? await assignCall(selectedCalls[0], selectedFSE)
          : await bulkAssignCalls(selectedCalls, selectedFSE);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `${selectedCalls.length} call(s) assigned successfully`
        );
        setSelectedCalls([]);
        setShowAssignDialog(false);
        setSelectedFSE(null);
        router.refresh();
      }
    });
  };

  const filteredFSEs = teamFSEs.filter(
    (f) =>
      !fseSearch ||
      (f.full_name ?? "").toLowerCase().includes(fseSearch.toLowerCase()) ||
      (f.city ?? "").toLowerCase().includes(fseSearch.toLowerCase())
  );

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Unassigned ({pendingCalls.length})
            </CardTitle>
            {selectedCalls.length > 0 && (
              <Button size="sm" onClick={handleAssign}>
                <UserCheck className="mr-2 h-4 w-4" />
                Assign {selectedCalls.length} Selected
              </Button>
            )}
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
            {pendingCalls.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                All calls are assigned
              </p>
            )}
            {pendingCalls.map((call) => (
              <div
                key={call.call_id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedCalls.includes(call.call_id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-accent/50"
                }`}
                onClick={() => toggleCall(call.call_id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">
                      {call.merchant_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {call.call_ticket_number}
                    </p>
                  </div>
                  {call.customer_code && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {call.customer_code}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {call.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {call.city}
                    </span>
                  )}
                  {call.call_type_name && <span>{call.call_type_name}</span>}
                  <span className="ml-auto">
                    {formatDistanceToNow(new Date(call.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team FSEs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              My FSEs ({teamFSEs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto space-y-2">
            {teamFSEs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No field engineers in your team
              </p>
            )}
            {teamFSEs.map((fse) => (
              <div
                key={fse.staff_id}
                className="flex items-center gap-3 border rounded-lg p-3"
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {getInitials(fse.full_name)}
                  </div>
                  {fse.in_progress_calls > 0 && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {fse.full_name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fse.designation} — {fse.city}, {fse.state}
                  </p>
                  {fse.phone && (
                    <a
                      href={`tel:${fse.phone}`}
                      className="text-xs text-primary flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="h-3 w-3" />
                      {fse.phone}
                    </a>
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={`text-lg font-bold ${
                      fse.open_calls > 3
                        ? "text-destructive"
                        : fse.open_calls > 1
                          ? "text-yellow-500"
                          : "text-green-500"
                    }`}
                  >
                    {fse.open_calls}
                  </div>
                  <div className="text-[10px] text-muted-foreground">open</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign {selectedCalls.length} Call(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Search FSE by name or city..."
              value={fseSearch}
              onChange={(e) => setFseSearch(e.target.value)}
            />
            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredFSEs.map((fse) => (
                <label
                  key={fse.staff_id}
                  className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedFSE === fse.staff_id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="assign-fse"
                    checked={selectedFSE === fse.staff_id}
                    onChange={() => setSelectedFSE(fse.staff_id)}
                    className="accent-primary"
                  />
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                    {getInitials(fse.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {fse.full_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fse.city}, {fse.state}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-sm">{fse.open_calls}</div>
                    <div className="text-[10px] text-muted-foreground">
                      open
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAssign}
              disabled={!selectedFSE || isPending}
            >
              {isPending ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
