"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  fetchStaffForAssignment,
  assignCall,
  bulkAssignCalls,
} from "@/app/(backoffice)/calls/actions";
import { useRouter } from "next/navigation";

interface StaffOption {
  staff_id: number;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  city: string | null;
  state: string | null;
}

interface AssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callIds: number[];
  onAssigned: () => void;
}

export function AssignDialog({
  open,
  onOpenChange,
  callIds,
  onAssigned,
}: AssignDialogProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchStaffForAssignment().then((result) => {
        setStaff(result);
        setSelectedStaff(null);
        setSearch("");
        setError(null);
      });
    }
  }, [open]);

  const filteredStaff = staff.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.city?.toLowerCase().includes(q)
    );
  });

  const handleAssign = () => {
    if (!selectedStaff) return;
    setError(null);
    startTransition(async () => {
      const result =
        callIds.length === 1
          ? await assignCall(callIds[0], selectedStaff)
          : await bulkAssignCalls(callIds, selectedStaff);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success(
          callIds.length === 1
            ? "Call assigned successfully"
            : `${callIds.length} calls assigned`
        );
        router.refresh();
        onAssigned();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Assign {callIds.length === 1 ? "Call" : `${callIds.length} Calls`}
          </DialogTitle>
          <DialogDescription>
            Select an FSE to assign {callIds.length === 1 ? "this call" : "these calls"} to.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Search FSE by name, phone, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="max-h-60 overflow-y-auto rounded-md border">
          {filteredStaff.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">
              No FSE found
            </p>
          ) : (
            filteredStaff.map((s) => (
              <button
                key={s.staff_id}
                type="button"
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent ${
                  selectedStaff === s.staff_id ? "bg-accent" : ""
                }`}
                onClick={() => setSelectedStaff(s.staff_id)}
              >
                <div>
                  <div className="font-medium">{s.full_name ?? "Unknown"}</div>
                  <div className="text-xs text-muted-foreground">
                    {[s.city, s.state].filter(Boolean).join(", ") || "No location"}
                  </div>
                </div>
                {s.phone && (
                  <span className="text-xs text-muted-foreground">
                    {s.phone}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedStaff || isPending}
          >
            {isPending ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
