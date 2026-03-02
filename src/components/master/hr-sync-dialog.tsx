"use client";

import { useState, useTransition } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

import {
  fetchHREmployees,
  syncFromHR,
  type HREmployee,
} from "@/app/(backoffice)/master/staff/actions";

interface HrSyncDialogProps {
  existingHrUserIds: string[];
}

export function HrSyncDialog({ existingHrUserIds }: HrSyncDialogProps) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<HREmployee[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, startSync] = useTransition();

  const existingSet = new Set(existingHrUserIds);

  async function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) {
      setLoading(true);
      setSelected(new Set());
      const result = await fetchHREmployees();
      if (result.error) {
        toast.error(result.error);
        setOpen(false);
      } else {
        setEmployees(result.employees);
      }
      setLoading(false);
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === employees.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(employees.map((e) => e.id)));
    }
  }

  function handleSync() {
    const ids = Array.from(selected);
    startSync(async () => {
      const result = await syncFromHR(ids);
      if (result.errors.length > 0) {
        toast.error(`Synced ${result.synced}, but ${result.errors.length} error(s)`, {
          description: result.errors[0],
        });
      } else {
        toast.success(`${result.synced} employee(s) synced successfully`);
      }
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync from HR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sync Staff from UDS-HR</DialogTitle>
          <DialogDescription>
            Select employees to import into POSBUDDY. Already-synced employees
            will be updated with latest HR data.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading HR data…
            </span>
          </div>
        ) : (
          <div className="overflow-auto flex-1 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        employees.length > 0 &&
                        selected.size === employees.length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Emp Code</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No employees found in HR system.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((emp) => {
                    const alreadySynced = existingSet.has(emp.id);
                    return (
                      <TableRow key={emp.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(emp.id)}
                            onCheckedChange={() => toggleOne(emp.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {emp.full_name ?? "—"}
                        </TableCell>
                        <TableCell>{emp.employee_code ?? "—"}</TableCell>
                        <TableCell>{emp.department ?? "—"}</TableCell>
                        <TableCell>{emp.designation ?? "—"}</TableCell>
                        <TableCell>{emp.city ?? "—"}</TableCell>
                        <TableCell>
                          {emp.deactivated_at ? (
                            <Badge variant="destructive">Inactive</Badge>
                          ) : alreadySynced ? (
                            <Badge variant="secondary">Synced</Badge>
                          ) : (
                            <Badge variant="outline">New</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-auto">
            {selected.size > 0 && `${selected.size} selected`}
          </div>
          <Button
            onClick={handleSync}
            disabled={selected.size === 0 || syncing}
          >
            {syncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sync {selected.size > 0 ? `(${selected.size})` : "Selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
