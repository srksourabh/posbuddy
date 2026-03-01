"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

type StaffRow = Database["public"]["Tables"]["pos_staff"]["Row"];

interface CurrentUser {
  user: User | null;
  staff: StaffRow | null;
  loading: boolean;
}

export function useCurrentUser(): CurrentUser {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<StaffRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchUserAndStaff() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setStaff(null);
        setLoading(false);
        return;
      }

      setUser(authUser);

      const { data: staffRows } = await supabase
        .from("pos_staff")
        .select("*")
        .filter("auth_user_id", "eq", authUser.id)
        .eq("is_active", true)
        .limit(1);

      setStaff((staffRows as StaffRow[] | null)?.[0] ?? null);
      setLoading(false);
    }

    fetchUserAndStaff();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setStaff(null);
        return;
      }
      setUser(session.user);
      // Re-fetch staff data on auth change
      supabase
        .from("pos_staff")
        .select("*")
        .filter("auth_user_id", "eq", session.user.id)
        .eq("is_active", true)
        .limit(1)
        .then(({ data }) =>
          setStaff((data as StaffRow[] | null)?.[0] ?? null)
        );
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, staff, loading };
}
