"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
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
import { Camera, X, ChevronLeft, ChevronRight, Check } from "lucide-react";

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

const TOTAL_STEPS = 3;

export function ClosureForm({
  callId,
  templateFields,
  onClose,
  onClosed,
}: ClosureFormProps) {
  const [step, setStep] = useState(1);
  const [closureStatus, setClosureStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [visitInTime, setVisitInTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [visitOutTime, setVisitOutTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dynamicValues, setDynamicValues] = useState<Record<number, string>>({});

  const setDynamicValue = (fieldId: number, value: string) => {
    setDynamicValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Split template fields into data fields vs photo/signature fields
  const dataFields = (templateFields ?? []).filter(
    (f) => f.field_type !== "photo" && f.field_type !== "signature"
  );
  const photoFields = (templateFields ?? []).filter(
    (f) => f.field_type === "photo" || f.field_type === "signature"
  );

  const validateStep1 = () => {
    if (!closureStatus) {
      setError("Please select a closure status");
      return false;
    }
    setError(null);
    return true;
  };

  const validateStep2 = () => {
    for (const field of dataFields) {
      if (field.is_required && !dynamicValues[field.template_field_id]?.trim()) {
        setError(`"${field.field_name}" is required`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const validateStep3 = () => {
    for (const field of photoFields) {
      if (field.is_required && !dynamicValues[field.template_field_id]?.trim()) {
        setError(`"${field.field_name}" is required`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = () => {
    if (!validateStep3()) return;

    startTransition(async () => {
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
          // GPS not available
        }
      }

      const allFields = [...dataFields, ...photoFields];
      const fieldValues = allFields
        .filter((f) => dynamicValues[f.template_field_id]?.trim())
        .map((f) => ({
          templateFieldId: f.template_field_id,
          value: dynamicValues[f.template_field_id].trim(),
        }));

      const result = await closeCall(callId, {
        closureStatus,
        remarks,
        visitInTime: new Date(visitInTime).toISOString(),
        visitOutTime: visitOutTime
          ? new Date(visitOutTime).toISOString()
          : new Date().toISOString(),
        gpsLatitude: gpsLat,
        gpsLongitude: gpsLng,
        fieldValues: fieldValues.length > 0 ? fieldValues : undefined,
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Close Service Call</CardTitle>
          <span className="text-xs text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-1 mt-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i < step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Step 1: Closure Status */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Step 1 — Closure Status
            </p>

            <div className="space-y-2">
              <Label>Closure Outcome *</Label>
              <Select value={closureStatus} onValueChange={setClosureStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome..." />
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
                placeholder="Any additional notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Customer-specific data fields */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Step 2 — Customer Required Fields
            </p>
            {dataFields.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No data fields required for this customer
              </p>
            ) : (
              dataFields.map((field) => (
                <DynamicField
                  key={field.template_field_id}
                  field={field}
                  value={dynamicValues[field.template_field_id] ?? ""}
                  onChange={(val) =>
                    setDynamicValue(field.template_field_id, val)
                  }
                />
              ))
            )}
          </div>
        )}

        {/* Step 3: Photos & Signature */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-foreground">
              Step 3 — Photos & Signature
            </p>
            {photoFields.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No photos or signature required
              </p>
            ) : (
              photoFields.map((field) =>
                field.field_type === "signature" ? (
                  <SignaturePad
                    key={field.template_field_id}
                    field={field}
                    value={dynamicValues[field.template_field_id] ?? ""}
                    onChange={(val) =>
                      setDynamicValue(field.template_field_id, val)
                    }
                  />
                ) : (
                  <PhotoCapture
                    key={field.template_field_id}
                    field={field}
                    value={dynamicValues[field.template_field_id] ?? ""}
                    onChange={(val) =>
                      setDynamicValue(field.template_field_id, val)
                    }
                  />
                )
              )
            )}
            <p className="text-xs text-muted-foreground text-center mt-2">
              GPS location will be captured automatically on submit
            </p>
          </div>
        )}

        {error && <p className="text-sm text-destructive mt-3">{error}</p>}

        {/* Navigation buttons */}
        <div className="flex gap-2 mt-6">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step < TOTAL_STEPS ? (
            <Button type="button" onClick={handleNext}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-1 h-4 w-4" />
              {isPending ? "Submitting..." : "Submit Closure"}
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Photo Capture Component ────────────────────────────────────────

function PhotoCapture({
  field,
  value,
  onChange,
}: {
  field: ClosureTemplateField;
  value: string;
  onChange: (val: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const label = `${field.field_name ?? "Photo"}${field.is_required ? " *" : ""}`;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      {value ? (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
          <Check className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400 flex-1">
            Photo captured
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            Retake
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors"
        >
          <Camera className="h-7 w-7 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Tap to take photo</span>
        </button>
      )}
    </div>
  );
}

// ─── Signature Pad Component ────────────────────────────────────────

function SignaturePad({
  field,
  value,
  onChange,
}: {
  field: ClosureTemplateField;
  value: string;
  onChange: (val: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const label = `${field.field_name ?? "Signature"}${field.is_required ? " *" : ""}`;

  const getCoords = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      isDrawingRef.current = true;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getCoords(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [getCoords]
  );

  const draw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getCoords(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [getCoords]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  }, [onChange]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSignature}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      <div className="border-2 border-dashed rounded-lg overflow-hidden bg-white dark:bg-gray-950">
        <canvas
          ref={canvasRef}
          width={320}
          height={150}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!value && (
          <p className="text-xs text-center text-muted-foreground pb-2">
            Sign here
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Dynamic Field Component (for Step 2 data fields) ───────────────

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

    default:
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
