// ─── Call Statuses ───────────────────────────────────────────────────
export const CALL_STATUSES = [
  "Pending",
  "Assigned",
  "In Progress",
  "Closed",
  "Cancelled",
] as const;

export type CallStatus = (typeof CALL_STATUSES)[number];

export const CLOSURE_STATUSES = [
  "Resolved",
  "Partially Resolved",
  "Unresolved - Part Required",
  "Unresolved - Merchant Not Available",
  "Unresolved - Wrong Address",
  "Unresolved - Other",
] as const;

export type ClosureStatus = (typeof CLOSURE_STATUSES)[number];

// ─── Departments ────────────────────────────────────────────────────
export const DEPARTMENTS = {
  FSE: "FSE",
  BACK_OFFICE: "Back Office",
  STOCK: "Stock",
  MANAGEMENT: "Management",
} as const;

export type Department = (typeof DEPARTMENTS)[keyof typeof DEPARTMENTS];

// ─── Status Badge Variants ──────────────────────────────────────────
export const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  Pending: "outline",
  Assigned: "secondary",
  "In Progress": "default",
  Closed: "secondary",
  Cancelled: "destructive",
};

// ─── Call Type Colors (for FSE cards) ───────────────────────────────
export const CALL_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Installation: { bg: "bg-green-100", text: "text-green-700" },
  "De-installation": { bg: "bg-red-100", text: "text-red-700" },
  "Break Down": { bg: "bg-yellow-100", text: "text-yellow-700" },
  "Asset Swap": { bg: "bg-blue-100", text: "text-blue-700" },
  "PM Visit": { bg: "bg-purple-100", text: "text-purple-700" },
};

export const DEFAULT_CALL_TYPE_COLOR = {
  bg: "bg-muted",
  text: "text-muted-foreground",
};
