"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * Subscribes to Supabase realtime changes on the `calls` table.
 * When a call is inserted or its status changes, shows a toast and
 * refreshes the current route's server data.
 */
export function useRealtimeCalls() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("calls-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls" },
        (payload) => {
          const ticket = (payload.new as { call_ticket_number?: string })
            .call_ticket_number;
          toast.info(`New call assigned: ${ticket ?? "unknown"}`);
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls" },
        (payload) => {
          const ticket = (payload.new as { call_ticket_number?: string })
            .call_ticket_number;
          const status = (payload.new as { call_status?: string }).call_status;
          toast.info(`Call ${ticket ?? ""} → ${status ?? "updated"}`);
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
}
