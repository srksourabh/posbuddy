import { createClient } from "@supabase/supabase-js";

// Server-only — never import this in client components.

/**
 * Creates a Supabase client pointing to the UDS-HR database.
 * Uses service_role key to read hr_profiles (bypasses RLS).
 */
export function createUdsHrClient() {
  const url = process.env.UDS_HR_SUPABASE_URL;
  const key = process.env.UDS_HR_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing UDS_HR_SUPABASE_URL or UDS_HR_SERVICE_ROLE_KEY env vars"
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
