/**
 * Get initials from a name or fallback to email prefix.
 */
export function getInitials(
  name: string | null | undefined,
  email?: string | undefined
): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return email ? email.substring(0, 2).toUpperCase() : "U";
}

/**
 * Flatten a Supabase row with joined relations into a flat object.
 * Strips out nested relation keys and merges selected fields.
 */
export function flattenRow<T>(
  row: Record<string, unknown>,
  relationKeys: string[],
  extras: Record<string, unknown> = {}
): T {
  const base = Object.fromEntries(
    Object.entries(row).filter(([k]) => !relationKeys.includes(k))
  );
  return { ...base, ...extras } as T;
}

/**
 * Build a staff ID → name lookup map from Supabase rows.
 */
export function buildStaffMap(
  staffRows: { staff_id: number; full_name: string | null }[]
): Record<number, string> {
  return Object.fromEntries(
    staffRows.map((s) => [s.staff_id, s.full_name ?? "Unknown"])
  );
}

/**
 * Sanitize error messages for user display.
 * Strips Supabase internal details and returns a safe message.
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    // Strip PostgreSQL / Supabase internal error details
    if (msg.includes("violates row-level security"))
      return "You don't have permission to perform this action.";
    if (msg.includes("duplicate key"))
      return "This record already exists.";
    if (msg.includes("violates foreign key"))
      return "Referenced record not found.";
    if (msg.includes("connection"))
      return "Database connection error. Please try again.";
    return msg.length > 200 ? msg.slice(0, 200) + "…" : msg;
  }
  if (typeof error === "string") {
    return error.length > 200 ? error.slice(0, 200) + "…" : error;
  }
  return "An unexpected error occurred.";
}

// ─── Standard action result type ────────────────────────────────────
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { error: string };
