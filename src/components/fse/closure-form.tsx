"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { closeCall } from "@/app/(fse)/my-calls/actions";

interface ClosureFormProps {
  callId: number;
  onClose: () => void;
  onClosed: () => void;
}

const CLOSURE_STATUSES = [
  "Resolved",
  "Partially Resolved",
  "Unresolved - Part Required",
  "Unresolved - Merchant Not Available",
  "Unresolved - Wrong Address",
  "Unresolved - Other",
];

export function ClosureForm({ callId, onClose, onClosed }: ClosureFormProps) {
  const [closureStatus, setClosureStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [visitInTime, setVisitInTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [visitOutTime, setVisitOutTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureStatus) return;
    setError(null);

    startTransition(async () => {
      // Try to get GPS location
      let gpsLat: number | undefined;
      let gpsLng: number | undefined;

      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>(
            (resolve, reject) =>
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              })
          );
          gpsLat = pos.coords.latitude;
          gpsLng = pos.coords.longitude;
        } catch {
          // GPS not available, continue without it
        }
      }

      const result = await closeCall(callId, {
        closureStatus,
        remarks,
        visitInTime: new Date(visitInTime).toISOString(),
        visitOutTime: visitOutTime
          ? new Date(visitOutTime).toISOString()
          : new Date().toISOString(),
        gpsLatitude: gpsLat,
        gpsLongitude: gpsLng,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onClosed();
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Close Call</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Closure Status *</Label>
            <Select value={closureStatus} onValueChange={setClosureStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                {CLOSURE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Visit In</Label>
              <Input
                type="datetime-local"
                value={visitInTime}
                onChange={(e) => setVisitInTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Visit Out</Label>
              <Input
                type="datetime-local"
                value={visitOutTime}
                onChange={(e) => setVisitOutTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Remarks</Label>
            <textarea
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Add any notes about the visit..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={!closureStatus || isPending}
            >
              {isPending ? "Submitting..." : "Submit Closure"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
