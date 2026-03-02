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
import { toast } from "sonner";
import { closeCall } from "@/app/(fse)/my-calls/actions";
import type { ClosureTemplateField } from "@/app/(fse)/my-calls/actions";

interface ClosureFormProps {
  callId: number;
  templateFields?: ClosureTemplateField[];
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

export function ClosureForm({
  callId,
  templateFields,
  onClose,
  onClosed,
}: ClosureFormProps) {
  const [closureStatus, setClosureStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [visitInTime, setVisitInTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [visitOutTime, setVisitOutTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Dynamic field values: templateFieldId → value
  const [dynamicValues, setDynamicValues] = useState<Record<number, string>>(
    {}
  );

  const setDynamicValue = (fieldId: number, value: string) => {
    setDynamicValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureStatus) return;

    // Validate required dynamic fields
    if (templateFields) {
      for (const field of templateFields) {
        if (
          field.is_required &&
          !dynamicValues[field.template_field_id]?.trim()
        ) {
          setError(`"${field.field_name}" is required`);
          return;
        }
      }
    }

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

      // Build dynamic field values array
      const fieldValues = templateFields
        ? templateFields
            .filter((f) => dynamicValues[f.template_field_id]?.trim())
            .map((f) => ({
              templateFieldId: f.template_field_id,
              value: dynamicValues[f.template_field_id].trim(),
            }))
        : undefined;

      const result = await closeCall(callId, {
        closureStatus,
        remarks,
        visitInTime: new Date(visitInTime).toISOString(),
        visitOutTime: visitOutTime
          ? new Date(visitOutTime).toISOString()
          : new Date().toISOString(),
        gpsLatitude: gpsLat,
        gpsLongitude: gpsLng,
        fieldValues,
      });

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        toast.success("Service call closed successfully");
        onClosed();
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Close Service Call</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fixed fields */}
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

          {/* Dynamic fields from customer template */}
          {templateFields && templateFields.length > 0 && (
            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground">
                Customer-specific fields
              </p>
              {templateFields.map((field) => (
                <DynamicField
                  key={field.template_field_id}
                  field={field}
                  value={dynamicValues[field.template_field_id] ?? ""}
                  onChange={(val) =>
                    setDynamicValue(field.template_field_id, val)
                  }
                />
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

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

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ClosureTemplateField;
  value: string;
  onChange: (val: string) => void;
}) {
  const label = `${field.field_name ?? "Field"}${field.is_required ? " *" : ""}`;

  switch (field.field_type) {
    case "textarea":
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <textarea
            className="flex min-h-16 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.field_name}`} />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(field.options_json) &&
                field.options_json.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "date":
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );

    case "photo":
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onloadend = () => {
                onChange(reader.result as string);
              };
              reader.readAsDataURL(file);
            }}
          />
          {value && (
            <p className="text-xs text-muted-foreground">Photo captured</p>
          )}
        </div>
      );

    case "signature":
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <p className="text-xs text-muted-foreground italic">
            Signature capture coming soon
          </p>
        </div>
      );

    default:
      // "text" and any unknown types
      return (
        <div className="space-y-2">
          <Label>{label}</Label>
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
}
