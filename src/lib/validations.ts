import { z } from "zod";
import { CALL_STATUSES, CLOSURE_STATUSES } from "@/lib/constants";

// Reusable field schemas
const positiveInt = z.number().int().positive();

// ─── Calls ───────────────────────────────────────────────────────────
export const assignCallSchema = z.object({
  callId: positiveInt,
  assignedToId: positiveInt,
});

export const bulkAssignCallsSchema = z.object({
  callIds: z.array(positiveInt).min(1, "Select at least one call"),
  assignedToId: positiveInt,
});

export const updateCallStatusSchema = z.object({
  callId: positiveInt,
  newStatus: z.enum(CALL_STATUSES),
  reason: z.string().max(500).optional(),
});

// ─── FSE Closure ─────────────────────────────────────────────────────
export const closeCallSchema = z.object({
  callId: positiveInt,
  closureData: z.object({
    closureStatus: z.enum(CLOSURE_STATUSES),
    remarks: z.string().min(1, "Remarks are required").max(2000),
    visitInTime: z.string().min(1, "Visit in-time is required"),
    visitOutTime: z.string().min(1, "Visit out-time is required"),
    gpsLatitude: z.number().min(-90).max(90).optional(),
    gpsLongitude: z.number().min(-180).max(180).optional(),
    fieldValues: z
      .array(
        z.object({
          templateFieldId: positiveInt,
          value: z.string(),
        })
      )
      .optional(),
  }),
});

export const startVisitSchema = z.object({
  callId: positiveInt,
});
